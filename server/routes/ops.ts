import type { RequestHandler } from "express";
import { pushActivity, setServiceState } from "../services/store";

export const installNginx: RequestHandler = (_req, res) => {
  setServiceState("nginx", "running");
  pushActivity({ kind: "nginx.installed", message: "Nginx installed via one‑click" });
  res.status(202).json({ status: "ok" });
};

export const restartNginx: RequestHandler = (_req, res) => {
  setServiceState("nginx", "restarting");
  setServiceState("nginx", "running");
  pushActivity({ kind: "nginx.restarted", message: "Nginx restarted" });
  res.status(202).json({ status: "ok" });
};

export const restartDocker: RequestHandler = (_req, res) => {
  setServiceState("docker", "restarting");
  setServiceState("docker", "running");
  pushActivity({ kind: "docker.restarted", message: "Docker restarted" });
  res.status(202).json({ status: "ok" });
};
