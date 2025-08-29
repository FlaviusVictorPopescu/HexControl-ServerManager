import type { RequestHandler } from "express";
import { pushActivity } from "../services/store";

export const installNginx: RequestHandler = (_req, res) => {
  pushActivity({ kind: "nginx.installed", message: "Nginx installed via one‑click" });
  res.status(202).json({ status: "ok" });
};

export const restartNginx: RequestHandler = (_req, res) => {
  pushActivity({ kind: "nginx.restarted", message: "Nginx restarted" });
  res.status(202).json({ status: "ok" });
};

export const restartDocker: RequestHandler = (_req, res) => {
  pushActivity({ kind: "docker.restarted", message: "Docker restarted" });
  res.status(202).json({ status: "ok" });
};
