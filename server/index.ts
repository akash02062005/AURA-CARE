import "dotenv/config"; // ✅ load .env variables first
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import mongoose from "mongoose"; // ✅ add mongoose

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ logging middleware
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

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ✅ connect to MongoDB Atlas
  try {
    const uri = process.env.MONGODB_URI as string;
    if (!uri) throw new Error("❌ MONGODB_URI not set in .env");

    await mongoose.connect(uri, {
      dbName: "recipesage", // change db name if you want
    });

    console.log("✅ MongoDB Atlas connected successfully");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB Atlas:", err);
    process.exit(1);
  }

  // ✅ register all API routes
  const server = await registerRoutes(app);

  // ✅ centralized error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ✅ Vite dev server or static build
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ✅ server listen
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "127.0.0.1";

  try {
    server.listen(port, host, () => {
      log(`🚀 Server running at http://${host}:${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to bind on host", host, err);
  }
})();
