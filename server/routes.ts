import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { database } from "./db";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { ImageAnalysisResponse, InsertImage, Image } from "@shared/schema";
import { r2Storage } from "./r2-storage";
import axios from "axios";
import rateLimit from "express-rate-limit";

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

    // Setup rate limiting for the analyze endpoint
    const rateLimitRequests = process.env.MAX_DEGHIBS_PER_DAY ? parseInt(process.env.MAX_DEGHIBS_PER_DAY) : 3;
    const analyzeRateLimiter = rateLimit({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        limit: rateLimitRequests, // limit each IP to X requests per day
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        message: {
            message: `You've reached your daily limit of ${rateLimitRequests} deghibs. Please try again tomorrow.`
        }
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

    // Endpoint to analyze image and generate detoxified version
    app.post(
        "/api/analyze",
        analyzeRateLimiter,
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
                console.log("Original image uploaded to R2 with key:", originalImageKey);

                // Analyze image with OpenAI Vision
                const analysisResponse = await openai.chat.completions.create({
                    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                    messages: [
                        {
                            role: "system",
                            content:
                                "You're an AI physician at the Ghibli Detox Clinic. Analyze the provided image to detect Ghibli-style elements (like Totoro, soot sprites, whimsical landscapes, magical creatures, fantasy elements, etc.). Respond in JSON format with 3 diagnosis points, 3 treatment points, a scene description with an entirely accurate description of the scene - make this description pixel perfect, add every detail in every inch since this will be used to recreate a version of this image, and a contamination level from 1-100.  The keys in the json ust be diagnosis_points, treatment_points, description, contamination_level",
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

                // Create new image based on description of the original but without Ghibli elements
                const sceneDescription = analysis.description || "";

                // Create prompt for the image generation
                const detoxPrompt = `Scene: ${sceneDescription} \nCreate a realistic photographic image that represents what this scene would look like in real life, completely free of any Studio Ghibli or anime aesthetics.`;

                console.log("Detox prompt:", detoxPrompt);
                // Use image generation with the original as reference
                const imageResponse = await openai.images.generate({
                    model: "dall-e-3", // Using DALL-E 3 for better quality and control
                    prompt: detoxPrompt,
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

                // Get the signed URLs for both images (for direct response to client)
                const originalImgUrl = await r2Storage.getImageUrl(originalImageKey);
                const detoxifiedImgUrl = await r2Storage.getImageUrl(detoxifiedImageKey);

                // Save data to database
                const imageData: InsertImage = {
                    originalImageKey: originalImageKey,
                    detoxifiedImageKey: detoxifiedImageKey,
                    diagnosisPoints: analysis.diagnosis_points || [],
                    treatmentPoints: analysis.treatment_points || [],
                    contaminationLevel: analysis.contamination_level || 50,
                    userId: null, // No user authentication for now
                    description: sceneDescription,
                    isPublic: true,  // All images are public by default
                };

                const savedImage = await database.saveImage(imageData);

                // Create response with link to shareable page
                const result: ImageAnalysisResponse = {
                    id: savedImage.id,
                    diagnosisPoints: analysis.diagnosis_points || [],
                    treatmentPoints: analysis.treatment_points || [],
                    contaminationLevel: analysis.contamination_level || 50,
                    detoxifiedImageUrl: detoxifiedImgUrl,
                    originalImageUrl: originalImgUrl,
                    shareableUrl: `/deghib/${savedImage.id}`,
                    description: sceneDescription
                };

                // Remove temporary file from uploads directory
                fs.unlinkSync(imagePath);

                res.status(200).json(result);
            } catch (error: any) {
                console.error("Error processing image:", error);

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

    const httpServer = createServer(app);

    return httpServer;
}
