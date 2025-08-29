import type { RequestHandler } from "express";
import { pushActivity, setServiceState } from "../services/store";
import { installNginxRemote, restartDockerRemote, restartNginxRemote } from "../services/remote";

export const installNginx: RequestHandler = async (_req, res) => {
  try {
    await installNginxRemote();
    setServiceState("nginx", "running");
    pushActivity({ kind: "nginx.installed", message: "Nginx installed via one‑click" });
    res.status(202).json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const restartNginx: RequestHandler = async (_req, res) => {
  try {
    setServiceState("nginx", "restarting");
    await restartNginxRemote();
    setServiceState("nginx", "running");
    pushActivity({ kind: "nginx.restarted", message: "Nginx restarted" });
    res.status(202).json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const restartDocker: RequestHandler = async (_req, res) => {
  try {
    setServiceState("docker", "restarting");
    await restartDockerRemote();
    setServiceState("docker", "running");
    pushActivity({ kind: "docker.restarted", message: "Docker restarted" });
    res.status(202).json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};
