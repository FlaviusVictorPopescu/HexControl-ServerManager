import type { RequestHandler } from "express";
import { runSSH } from "../services/remote";
import type { DockerContainerInfo } from "@shared/api";
import { pushActivity } from "../services/store";

export const listContainers: RequestHandler = async (_req, res) => {
  try {
    const { stdout } = await runSSH("docker ps -a --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}'");
    const items: DockerContainerInfo[] = stdout
      .trim()
      .split(/\n/)
      .filter(Boolean)
      .map((l) => {
        const [id, name, image, status, ports] = l.split("|");
        return { id, name, image, status, ports } as DockerContainerInfo;
      });
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const installDocker: RequestHandler = async (_req, res) => {
  try {
    const script = `bash -lc 'curl -fsSL https://get.docker.com | sh'`;
    await runSSH(script);
    pushActivity({ kind: "docker.restarted", message: "Docker installed/updated" });
    res.json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const restartDocker: RequestHandler = async (_req, res) => {
  try {
    await runSSH("systemctl restart docker");
    pushActivity({ kind: "docker.restarted", message: "Docker service restarted" });
    res.json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const deleteContainer: RequestHandler = async (req, res) => {
  const { id } = req.body as { id: string };
  try {
    await runSSH(`docker rm -f ${id}`);
    pushActivity({ kind: "docker.restarted", message: `Container ${id} deleted` });
    res.json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const createContainer: RequestHandler = async (req, res) => {
  const { name, image, portHost, portContainer } = req.body as { name: string; image: string; portHost?: number; portContainer?: number };
  if (!name || !image) return res.status(400).json({ error: "name and image are required" });
  try {
    const portArg = portHost && portContainer ? `-p ${portHost}:${portContainer}` : "";
    await runSSH(`docker run -d --restart unless-stopped --name ${name} ${portArg} ${image}`);
    pushActivity({ kind: "docker.assigned", message: `Container ${name} created from ${image}` });
    res.json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const assignContainerToDomain: RequestHandler = async (req, res) => {
  const { domain, port } = req.body as { domain: string; port: number };
  if (!domain || !port) return res.status(400).json({ error: "domain and port are required" });
  try {
    const upstream = `http://localhost:${port}`;
    // reuse nginx proxy writer by calling the API function equivalent via SSH inline
    const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, "");
    const content = `server {\n  listen 80;\n  server_name ${safeDomain};\n  location / {\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_pass ${upstream};\n  }\n}`;
    const writeCmd = `bash -lc 'printf %s "${content.replace(/"/g, "\\\"")}" | tee /etc/nginx/sites-available/${safeDomain}.conf >/dev/null'`;
    await runSSH(writeCmd);
    await runSSH(`bash -lc 'ln -sf /etc/nginx/sites-available/${safeDomain}.conf /etc/nginx/sites-enabled/${safeDomain}.conf && nginx -t && systemctl reload nginx'`);
    pushActivity({ kind: "docker.assigned", message: `Assigned container at ${upstream} to ${safeDomain}` });
    res.json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};
