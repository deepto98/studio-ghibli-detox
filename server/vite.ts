import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

// Define common request ID generator
const getRequestId = () => nanoid(5);

export function log(message: string, source = "express") {
    console.log(`[${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
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

    return server;
}

export function serveStatic(app: Express) {

    // Middleware to handle JavaScript MIME types
    app.use((req, res, next) => {
        const url = req.url;
        if (url.endsWith('.js') || url.includes('.js?')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        if (url.endsWith('.css') || url.includes('.css?')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
        next();
    });
    // This is only used in production
    app.use(express.static(path.resolve(__dirname, "../dist/public")));
    // Serve index.html for all routes to let client-side routing handle them
    app.get("*", (_req, res) => {
        res.sendFile(path.resolve(__dirname, "../dist/public", "index.html"));
    });
}