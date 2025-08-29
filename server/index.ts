import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getDomains, postDomain, putDomain, deleteDomainHandler, getDomainById } from "./routes/domains";
import { listFilesHandler, uploadFileHandler, deleteFileHandler } from "./routes/files";
import { sseEvents } from "./routes/events";
import { installNginx, restartDocker, restartNginx } from "./routes/ops";
import { login, logout, me } from "./routes/auth";
import { getNginxScript, getDockerComposeScript } from "./routes/scripts";
import { getServices } from "./routes/services";

export function createServer() {
  const app = express();
  // Start background poller for services (SSH)
  try { require("./services/poller").startServicesPoller(); } catch {}

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

  // Auth
  app.post("/api/auth/login", login);
  app.get("/api/auth/me", me);
  app.post("/api/auth/logout", logout);

  // Services status
  app.get("/api/services/status", getServices);

  // Operations (stubbed)
  app.post("/api/nginx/install", installNginx);
  app.post("/api/nginx/restart", restartNginx);
  app.post("/api/docker/restart", restartDocker);

  // Install scripts
  app.get("/api/scripts/nginx.sh", getNginxScript);
  app.get("/api/scripts/docker-compose.sh", getDockerComposeScript);

  return app;
}
