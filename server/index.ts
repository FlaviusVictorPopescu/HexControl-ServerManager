import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getDomains, postDomain, putDomain, deleteDomainHandler, getDomainById } from "./routes/domains";
import { listFilesHandler, uploadFileHandler, deleteFileHandler } from "./routes/files";
import { sseEvents } from "./routes/events";
import { installNginx, restartDocker, restartNginx } from "./routes/ops";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Domain management
  app.get("/api/domains", getDomains);
  app.post("/api/domains", postDomain);
  app.get("/api/domains/:id", getDomainById);
  app.put("/api/domains/:id", putDomain);
  app.delete("/api/domains/:id", deleteDomainHandler);

  // File manager
  app.get("/api/domains/:domainId/files", listFilesHandler);
  app.post("/api/domains/:domainId/files", uploadFileHandler);
  app.delete("/api/domains/:domainId/files/:fileId", deleteFileHandler);

  // Real-time events via SSE
  app.get("/api/events", sseEvents);

  // Operations (stubbed)
  app.post("/api/nginx/install", installNginx);
  app.post("/api/nginx/restart", restartNginx);
  app.post("/api/docker/restart", restartDocker);

  return app;
}
