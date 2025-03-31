import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define common request ID generator
const getRequestId = () => nanoid(5);

export function log(message: string, source = "express") {
    console.log(`[${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
    // Only import Vite in development mode
    if (process.env.NODE_ENV !== 'production') {
        try {
            // Dynamically import Vite and its config
            const { createServer: createViteServer } = await import('vite');
            const viteConfig = await import("../vite.config.js");

            const vite = await createViteServer({
                server: { middlewareMode: true },
                appType: "spa",
                configFile: path.resolve(__dirname, "../vite.config.ts"),
            });

            app.use(vite.middlewares);

            app.use("*", async (req, res) => {
                const url = req.originalUrl;
                const requestId = getRequestId();

                try {
                    // If file is not found, let vite serve the index.html
                    let template = fs.readFileSync(
                        path.resolve(__dirname, "../client/index.html"),
                        "utf-8"
                    );
                    template = await vite.transformIndexHtml(url, template);
                    res.status(200).set({ "Content-Type": "text/html" }).end(template);
                } catch (e: any) {
                    vite.ssrFixStacktrace(e);
                    console.log(`${requestId}: Error processing ${url}:`, e.stack);
                    res.status(500).end(e.stack);
                }
            });
        } catch (error) {
            console.error("Failed to initialize Vite:", error);
        }
    } else {
        // In production, just serve static files
        serveStatic(app);
    }

    return server;
}

export function serveStatic(app: Express) {
    // This is only used in production
    const staticDir = process.env.NODE_ENV === 'production'
        ? path.resolve(__dirname, "../client")
        : path.resolve(__dirname, "public");

    app.use(express.static(staticDir));

    // Serve index.html for all routes to let client-side routing handle them
    app.get("*", (_req, res) => {
        const indexPath = process.env.NODE_ENV === 'production'
            ? path.resolve(__dirname, "../client/index.html")
            : path.resolve(__dirname, "public", "index.html");
        res.sendFile(indexPath);
    });
}