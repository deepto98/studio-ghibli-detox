import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { ImageAnalysisResponse, InsertImage, Image } from "@shared/schema";
import sharp from "sharp";

// Define a custom Request interface with file from multer
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
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

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function registerRoutes(app: Express): Promise<Server> {
    // put application routes here
    // prefix all routes with /api

    // Endpoint to get image analysis by ID
    app.get("/api/images/:id", async (req, res) => {
        try {
            const imageId = parseInt(req.params.id);
            if (isNaN(imageId)) {
                return res.status(400).json({ message: "Invalid image ID" });
            }

            const image = await storage.getImage(imageId);
            if (!image) {
                return res.status(404).json({ message: "Image not found" });
            }

            // The diagnosisPoints and treatmentPoints are already arrays in the database schema

            const result: ImageAnalysisResponse = {
                id: image.id,
                diagnosisPoints: image.diagnosisPoints || [],
                treatmentPoints: image.treatmentPoints || [],
                contaminationLevel: image.contaminationLevel || 0,
                detoxifiedImageUrl: image.detoxifiedImageUrl || "",
                originalImageUrl: image.originalImageUrl || "",
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
    app.get("/api/images", async (req, res) => {
        try {
            // Just get all images for now, can add pagination later if needed
            const images = await storage.getAllImages();

            // Map to simpler format for gallery display
            const galleryItems = images.map((image) => ({
                id: image.id,
                detoxifiedImageUrl: image.detoxifiedImageUrl || "",
                originalImageUrl: image.originalImageUrl || "",
                contaminationLevel: image.contaminationLevel || 0,
            }));

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
        (req, res, next) => {
            console.log("Request headers:", req.headers);
            console.log("Request body keys:", Object.keys(req.body || {}));
            next();
        },
        upload.single("image"),
        async (req: MulterRequest, res: Response) => {
            try {
                console.log("After multer middleware");
                console.log("File received:", req.file);

                if (!req.file) {
                    return res.status(400).json({ message: "No image file uploaded" });
                }

                const imagePath = req.file.path;
                // Read the image directly
                const imageBuffer = fs.readFileSync(imagePath);

                // Convert image to base64 for analysis
                const base64Image = imageBuffer.toString("base64");

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
                console.log("Analysis response:", analysisResponse);
                // Parse the analysis
                const analysis = JSON.parse(
                    analysisResponse.choices[0].message.content || "{}",
                );
                console.log("Analysis  :", analysis);
                console.log("Diagnosis points:", analysis.diagnosis_points);
                console.log("Treatment points:", analysis.treatment_points);
                console.log("COntamination level:", analysis.contamination_level);
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

                // Save data to storage
                // Get the filename from the path to create a URL-friendly path for the original image
                const originalImageFilename = path.basename(req.file.path);

                const imageData: InsertImage = {
                    originalImageUrl: `/uploads/${originalImageFilename}`, // Set the path to access the uploaded file
                    detoxifiedImageUrl: imageResponse.data[0].url || "",
                    diagnosisPoints: analysis.diagnosis_points || [],
                    treatmentPoints: analysis.treatment_points || [],
                    contaminationLevel: analysis.contamination_level || 50,
                    userId: null, // No user authentication for now
                    shareableUrl: `/deghib/${Date.now()}` // Will be updated with actual ID after save
                };

                const savedImage = await storage.saveImage(imageData);

                // Create response with link to shareable page
                // Update shareableUrl with the actual ID
                const updatedImageData = {
                    ...savedImage,
                    shareableUrl: `/deghib/${savedImage.id}`
                };

                const result: ImageAnalysisResponse = {
                    diagnosisPoints: analysis.diagnosis_points || [],
                    treatmentPoints: analysis.treatment_points || [],
                    contaminationLevel: analysis.contamination_level || 50,
                    detoxifiedImageUrl: imageResponse.data[0].url || "",
                    id: savedImage.id,
                    shareableUrl: `/deghib/${savedImage.id}`,
                    originalImageUrl: savedImage.originalImageUrl || ""
                };

                // We're now keeping the original image file for display
                // rather than deleting it

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
