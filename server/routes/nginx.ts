import type { RequestHandler } from "express";
import { runSSH } from "../services/remote";
import type { NginxSiteSummary } from "@shared/api";
import { pushActivity } from "../services/store";
import { issueSslForDomain } from "../services/nginx-utils";

export const getNginxConfig: RequestHandler = async (_req, res) => {
  try {
    const { stdout } = await runSSH(
      "cat /etc/nginx/nginx.conf || echo MISSING",
    );
    res.type("text/plain").send(stdout);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const listNginxSites: RequestHandler = async (_req, res) => {
  try {
    const { stdout: enabledList } = await runSSH(
      "ls /etc/nginx/sites-enabled 2>/dev/null || true",
    );
    const enabledNames = new Set(enabledList.split(/\n+/).filter(Boolean));
    const { stdout } = await runSSH(
      "grep -R -nE 'server_name|listen|proxy_pass' /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null || true",
    );
    const map = new Map<string, NginxSiteSummary>();
    stdout.split(/\n/).forEach((line) => {
      const [file, _line, rest] = line.split(":");
      if (!file || !rest) return;
      const key = file;
      const base = file.split("/").pop() || "";
      const name = base.replace(/\.conf$/, "");
      const enabled =
        enabledNames.has(name + ".conf") || file.includes("/sites-enabled/");
      const item = map.get(key) || {
        file,
        serverName: "",
        listens: [],
        upstream: null,
        enabled,
      };
      if (rest.includes("server_name")) {
        const m = rest.match(/server_name\s+([^;]+);/);
        if (m) item.serverName = m[1].trim();
      }
      if (rest.includes("listen")) {
        const m = rest.match(/listen\s+([^;]+);/);
        if (m) item.listens.push(m[1].trim());
      }
      if (rest.includes("proxy_pass")) {
        const m = rest.match(/proxy_pass\s+([^;]+);/);
        if (m) item.upstream = m[1].trim();
      }
      map.set(key, item);
    });
    res.json(Array.from(map.values()));
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const configureProxy: RequestHandler = async (req, res) => {
  const { domain, upstream } = req.body as { domain: string; upstream: string };
  if (!domain || !upstream)
    return res.status(400).json({ error: "domain and upstream are required" });
  const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, "");
  const content = `server {\n  listen 80;\n  server_name ${safeDomain};\n  location / {\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_pass ${upstream};\n  }\n}`;
  try {
    const pathA = `/etc/nginx/sites-available/${safeDomain}.conf`;
    const pathE = `/etc/nginx/sites-enabled/${safeDomain}.conf`;
    const writeCmd = `bash -lc 'printf %s "${content.replace(/"/g, '\\"')}" | tee ${pathA} >/dev/null'`;
    await runSSH(writeCmd);
    await runSSH(`bash -lc 'ln -sf ${pathA} ${pathE} && nginx -t'`);
    await runSSH("systemctl reload nginx");
    pushActivity({
      kind: "domain.updated",
      message: `Nginx proxy configured for ${safeDomain}`,
    });
    res.json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const enableSite: RequestHandler = async (req, res) => {
  const name = ((req.body?.domain as string) || "").replace(
    /[^a-zA-Z0-9.-]/g,
    "",
  );
  try {
    await runSSH(
      `bash -lc 'ln -sf /etc/nginx/sites-available/${name}.conf /etc/nginx/sites-enabled/${name}.conf && nginx -t && systemctl reload nginx'`,
    );
    pushActivity({ kind: "domain.updated", message: `Enabled site ${name}` });
    // Auto-SSL attempt (non-blocking)
    issueSslForDomain(name).catch(() => {});
    res.json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const disableSite: RequestHandler = async (req, res) => {
  const name = ((req.body?.domain as string) || "").replace(
    /[^a-zA-Z0-9.-]/g,
    "",
  );
  try {
    await runSSH(
      `bash -lc 'rm -f /etc/nginx/sites-enabled/${name}.conf && nginx -t && systemctl reload nginx'`,
    );
    pushActivity({ kind: "domain.updated", message: `Disabled site ${name}` });
    res.json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};

export const issueSSL: RequestHandler = async (req, res) => {
  const name = ((req.body?.domain as string) || "").replace(
    /[^a-zA-Z0-9.-]/g,
    "",
  );
  try {
    await issueSslForDomain(name);
    res.json({ status: "ok" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};
