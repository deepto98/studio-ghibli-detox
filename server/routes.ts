import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { database } from "./db";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { ImageAnalysisResponse, InsertImage, Image, PartialAnalysisResponse, ImageCreationResponse } from "@shared/schema";
import { r2Storage } from "./r2-storage";
import { deleteFileFromR2 } from "./r2";
import axios from "axios";
import rateLimit from "express-rate-limit";

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get max deghibs per day from .env file (default to 3 if not specified)
const MAX_DEGHIBS_PER_DAY = parseInt(process.env.MAX_DEGHIBS_PER_DAY || "3", 10);

// Define a custom Request interface with file from multer
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist (temporary storage)
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads (temporary storage)
const storage_config = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage_config,
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit for OpenAI API
    fileFilter: function (req, file, cb) {
        // Accept only image files compatible with OpenAI API
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
            return cb(null, false);
        }
        cb(null, true);
    },
});

export async function registerRoutes(app: Express): Promise<Server> {
    // Initialize OpenAI client inside the function to ensure environment variables are loaded
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

    // Log the OpenAI API key status (not the actual key) for debugging
    console.log("OpenAI API Key status:", process.env.OPENAI_API_KEY ? "Key is set" : "Key is missing");
    console.log("R2 Storage status:", process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? "R2 credentials set" : "R2 credentials missing");

    // Setup rate limiting for the analyze endpoint - based on the client IP
    const rateLimitRequests = process.env.MAX_DEGHIBS_PER_DAY ? parseInt(process.env.MAX_DEGHIBS_PER_DAY) : 3;
    const analyzeRateLimiter = rateLimit({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        limit: rateLimitRequests, // limit each IP to X requests per day defined in .env
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        message: {
            message: `You've reached your daily limit of ${rateLimitRequests} deghibs. Please try again tomorrow.`
        },
        keyGenerator: (req) => {
            // Use the client's IP address as the rate limit key
            const clientIP = req.clientIp ||
                // req.headers['x-forwarded-for'] ||
                // req.socket.remoteAddress ||
                'unknown';
            console.log(`Rate limit check for IP: ${clientIP}`);
            return typeof clientIP === 'string' ? clientIP : Array.isArray(clientIP) ? clientIP[0] : 'unknown';
        },
        skipSuccessfulRequests: false, // Count all requests toward the limit
        skip: (req, res) => false // Don't skip any requests
    });

    const generateRateLimiter = rateLimit({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        limit: rateLimitRequests, // limit each IP to X requests per day defined in .env
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        message: {
            message: `You've reached your daily limit of ${rateLimitRequests} deghibs. Please try again tomorrow.`
        },
        keyGenerator: (req) => {
            // Use the client's IP address as the rate limit key
            const clientIP = req.clientIp ||
                // req.headers['x-forwarded-for'] ||
                // req.socket.remoteAddress ||
                'unknown';
            console.log(`Rate limit check for IP: ${clientIP}`);
            return typeof clientIP === 'string' ? clientIP : Array.isArray(clientIP) ? clientIP[0] : 'unknown';
        },
        skipSuccessfulRequests: false, // Count all requests toward the limit
        skip: (req, res) => false // Don't skip any requests
    });
    
    // Endpoint to get total count of deghibs
    app.get("/api/stats/count", async (req, res) => {
        try {
            const images = await database.getAllImages();
            res.status(200).json({ count: images.length });
        } catch (error: any) {
            console.error("Error fetching deghib count:", error);
            res.status(500).json({
                message: "Error fetching deghib count",
                error: error.message || "Unknown error occurred",
            });
        }
    });

    // Helper function to get signed URLs for image keys
    async function getSignedUrls(image: Image) {
        if (!image) return null;

        try {
            // Get signed URLs for both original and detoxified images
            const originalImageUrl = image.originalImageKey
                ? await r2Storage.getImageUrl(image.originalImageKey)
                : "";

            const detoxifiedImageUrl = image.detoxifiedImageKey
                ? await r2Storage.getImageUrl(image.detoxifiedImageKey)
                : "";

            return {
                ...image,
                originalImageUrl,
                detoxifiedImageUrl
            };
        } catch (error) {
            console.error("Error generating signed URLs:", error);
            return {
                ...image,
                originalImageUrl: "",
                detoxifiedImageUrl: ""
            };
        }
    }

    // Endpoint to get image analysis by ID
    app.get("/api/images/:id", async (req, res) => {
        try {
            const imageId = parseInt(req.params.id);
            if (isNaN(imageId)) {
                return res.status(400).json({ message: "Invalid image ID" });
            }

            const image = await database.getImage(imageId);
            if (!image) {
                return res.status(404).json({ message: "Image not found" });
            }

            // Get signed URLs for the images
            const imageWithUrls = await getSignedUrls(image);

            const result: ImageAnalysisResponse = {
                id: image.id,
                diagnosisPoints: image.diagnosisPoints || [],
                treatmentPoints: image.treatmentPoints || [],
                contaminationLevel: image.contaminationLevel || 0,
                detoxifiedImageUrl: (imageWithUrls === null) ? "" : (imageWithUrls.detoxifiedImageUrl || ""),
                originalImageUrl: (imageWithUrls === null) ? "" : (imageWithUrls.originalImageUrl || ""),
                shareableUrl: `/deghib/${image.id}`,
            };

            res.status(200).json(result);
        } catch (error: any) {
            console.error("Error fetching image:", error);
            res.status(500).json({
                message: "Error fetching image data",
                error: error.message || "Unknown error occurred",
            });
        }
    });

    // Endpoint to get list of recent images for gallery
    app.get("/api/images", async (req, res): Promise<void> => {
        try {
            // Just get all images for now, can add pagination later if needed
            const images = await database.getAllPublicImages();

            // Get signed URLs for all images and create gallery items
            const galleryItemsPromises = images.map(async (image) => {
                const imageWithUrls = await getSignedUrls(image);
                return {
                    id: image.id,
                    detoxifiedImageUrl: (imageWithUrls === null) ? "" : (imageWithUrls.detoxifiedImageUrl || ""),
                    originalImageUrl: (imageWithUrls === null) ? "" : (imageWithUrls.originalImageUrl || ""),
                    contaminationLevel: image.contaminationLevel || 0,
                };
            });

            const galleryItems = await Promise.all(galleryItemsPromises);
            res.status(200).json(galleryItems);
        } catch (error: any) {
            console.error("Error fetching images:", error);
            res.status(500).json({
                message: "Error fetching gallery data",
                error: error.message || "Unknown error occurred",
            });
        }
    });

    // Step 1: Analyze image and return preliminary results
    app.post(
        "/api/analyze",
        analyzeRateLimiter, // Apply rate limiter to this endpoint
        upload.single("image"),
        async (req: MulterRequest, res: Response) => {
            try {
                console.log("File received:", req.file);

                if (!req.file) {
                    return res.status(400).json({ message: "No image file uploaded" });
                }

                const imagePath = req.file.path;
                // Read the image directly
                const imageBuffer = fs.readFileSync(imagePath);

                // Convert image to base64 for analysis
                const base64Image = imageBuffer.toString("base64");

                // Upload original image to R2
                const contentType = req.file.mimetype;
                const originalImageKey = await r2Storage.uploadImage(imageBuffer, contentType);
                // Get original image URL
                const originalImgUrl = await r2Storage.getImageUrl(originalImageKey);

                console.log("Original image uploaded to R2 with key:", originalImageKey);

                // Analyze image with OpenAI Vision
                const analysisResponse = await openai.chat.completions.create({
                    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                    messages: [
                        {
                            role: "system",
                            content:
                                "You're an AI physician at the Ghibli Detox Clinic. Analyze the provided image to detect Ghibli-style elements (like Totoro, soot sprites, whimsical landscapes, magical creatures, fantasy elements, etc.). Respond in JSON format with 3 diagnosis points, 3 treatment points, a scene description with an entirely accurate depiction of the scene - make this description pixel perfect, make note of the genders, appearances, complexion of characters. add every detail in every inch since this will be used to recreate a version of this image, and a contamination level from 1-100.  The keys in the json ust be diagnosis_points, treatment_points, description, contamination_level",
                        },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Analyze this image and provide a humorous medical diagnosis of its Ghibli-style contamination. Be creative and funny while providing specific details about what Ghibli elements you detect.",
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/${req.file.mimetype.split("/")[1]};base64,${base64Image}`,
                                    },
                                },
                            ],
                        },
                    ],
                    response_format: { type: "json_object" },
                    max_tokens: 500,
                });

                // Parse the analysis
                const analysis = JSON.parse(
                    analysisResponse.choices[0].message.content || "{}",
                );
                console.log("Analysis:", analysis);

                // Get the scene description
                const sceneDescription = analysis.description || "";

                // Create prompt for the image generation
                const detoxPrompt = `Scene: ${sceneDescription} \nCreate a realistic photographic image that represents what this scene would look like in real life, completely free of any Studio Ghibli or anime aesthetics.`;

                // Return partial results first
                const partialResult: PartialAnalysisResponse = {
                    diagnosisPoints: analysis.diagnosis_points || [],
                    contaminationLevel: analysis.contamination_level || 50,
                    originalImageUrl: originalImgUrl,
                    description: sceneDescription,
                    originalImageKey: originalImageKey,
                    promptForDalle: detoxPrompt
                };

                // Remove temporary file from uploads directory
                fs.unlinkSync(imagePath);

                res.status(200).json(partialResult);
            } catch (error: any) {
                console.error("Error processing image analysis:", error);

                let errorMessage = "Error processing image";
                let statusCode = 500;

                // Check if it's an image format error
                if (
                    error.message &&
                    (error.message.includes("invalid_image_format") ||
                        error.message.includes("Invalid input image"))
                ) {
                    errorMessage =
                        "Image format error: Please upload a valid JPG, JPEG, PNG, or WEBP file less than 4MB";
                    statusCode = 400;
                } else if (error.code === "ENOENT") {
                    errorMessage =
                        "Error accessing the image file. Please try uploading again.";
                    statusCode = 400;
                }

                // Try to clean up the temporary file if it exists
                if (req.file && req.file.path) {
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (err) {
                        console.error("Error cleaning up temporary file:", err);
                    }
                }

                res.status(statusCode).json({
                    message: errorMessage,
                    error: error.message || "Unknown error occurred",
                });
            }
        },
    );
    // Step 2: Generate detoxified image
    app.post("/api/generate", generateRateLimiter, async (req, res) => {
        try {
            // Extract information from the request body
            const { originalImageKey, promptForDalle, diagnosisPoints, contaminationLevel } = req.body;

            if (!originalImageKey || !promptForDalle) {
                return res.status(400).json({ message: "Missing required parameters" });
            }

            console.log("Generating detoxified image with prompt:", promptForDalle);

            // Generate the detoxified image using DALL-E
            const imageResponse = await openai.images.generate({
                model: "dall-e-3", // Using DALL-E 3 for better quality and control
                prompt: promptForDalle,
                n: 1,
                size: "1024x1024",
                quality: "hd",
            });

            // Get detoxified image URL and download it
            const detoxifiedImageUrl = imageResponse.data[0].url || "";

            // Download the detoxified image and upload to R2
            const detoxifiedImageResponse = await axios.get(detoxifiedImageUrl, { responseType: 'arraybuffer' });
            const detoxifiedImageBuffer = Buffer.from(detoxifiedImageResponse.data);

            // Upload detoxified image to R2
            const detoxifiedImageKey = await r2Storage.uploadImage(detoxifiedImageBuffer, 'image/png');
            console.log("Detoxified image uploaded to R2 with key:", detoxifiedImageKey);

            // Generate treatment points (these come from the DALL-E response analysis)
            const treatmentPoints = [
                "Careful removal of whimsical elements",
                "Realistic color palette restoration",
                "Natural perspective alignment"
            ];

            // Save data to database
            const imageData: InsertImage = {
                originalImageKey: originalImageKey,
                detoxifiedImageKey: detoxifiedImageKey,
                diagnosisPoints: diagnosisPoints || [],
                treatmentPoints: treatmentPoints,
                contaminationLevel: contaminationLevel || 50,
                userId: null, // No user authentication for now
                description: promptForDalle.split('\n')[0].replace('Scene: ', ''),
                isPublic: true,  // All images are public by default
            };

            const savedImage = await database.saveImage(imageData);

            // Create response with the detoxified image and treatment info
            const result: ImageCreationResponse = {
                id: savedImage.id,
                treatmentPoints: treatmentPoints,
                detoxifiedImageUrl: detoxifiedImageUrl
            };

            res.status(200).json(result);
        } catch (error: any) {
            console.error("Error generating detoxified image:", error);
            res.status(500).json({
                message: "Error generating detoxified image",
                error: error.message || "Unknown error occurred"
            });
        }
    });


    // Delete image endpoint with time-based validation (2-minute window)
    app.delete("/api/images/:id", async (req, res) => {
        try {
            const imageId = parseInt(req.params.id);
            if (isNaN(imageId)) {
                return res.status(400).json({ message: "Invalid image ID" });
            }

            // Get the image first to retrieve the image keys and created timestamp
            const image = await database.getImage(imageId);
            if (!image) {
                return res.status(404).json({ message: "Image not found" });
            }

            // Check if the image was created within the last 2 minutes
            const createdAt = image.createdAt;
            if (createdAt) {
                const currentTime = new Date();
                const imageCreationTime = new Date(createdAt);
                const timeDiffInMinutes = (currentTime.getTime() - imageCreationTime.getTime()) / (1000 * 60);

                if (timeDiffInMinutes > 2) {
                    return res.status(403).json({
                        message: "Images can only be deleted within 2 minutes of creation. Please contact support for removal requests.",
                        timeSinceCreation: Math.round(timeDiffInMinutes)
                    });
                }
            }

            // Delete the image from the database
            await database.deleteImage(imageId);

            // Delete the image files from R2 storage
            if (image.originalImageKey) {
                await deleteFileFromR2(image.originalImageKey);
            }

            if (image.detoxifiedImageKey) {
                await deleteFileFromR2(image.detoxifiedImageKey);
            }

            return res.status(200).json({
                message: "Image successfully deleted",
                id: imageId
            });
        } catch (error: any) {
            console.error("Error deleting image:", error);
            return res.status(500).json({
                message: "An error occurred while deleting the image",
                error: error.message
            });
        }
    });

    const httpServer = createServer(app);

    return httpServer;
}
