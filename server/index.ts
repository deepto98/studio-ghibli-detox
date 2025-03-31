// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config(); // This loads the .env file contents into process.env

import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the Express app and HTTP server
const app = express();
const server = createServer(app);
app.use(express.json());

// Log middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[express] ${logLine}`);
    }
  });

  next();
});

// Helper function for error logging
function log(message: string, source = "express") {
    console.log(`[${source}] ${message}`);
}

// Serve static files in production
function serveStatic(app: express.Express) {
  const clientDir = path.resolve(__dirname, "../client");
  log(`Serving static files from ${clientDir}`);
  
  app.use(express.static(clientDir));
  
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(clientDir, "index.html"));
  });
}

(async () => {
  // Register API routes
  await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Check environment to decide how to handle frontend
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    // Only in development: dynamically import Vite setup
    log("Development mode: Setting up Vite");
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  } else {
    // In production: serve static files
    log("Production mode: Serving static files");
    serveStatic(app);
  }

  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    log(`Server listening on port ${port}`);
  });
})();