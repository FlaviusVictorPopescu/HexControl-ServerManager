import { Client } from "ssh2";

function env(name: string, fallback?: string) {
  const v = process.env[name];
  return (v && v.length > 0 ? v : undefined) ?? fallback;
}

const SSH_HOST = env("SSH_HOST");
const SSH_PORT = Number(env("SSH_PORT", "22"));
const SSH_USER = env("SSH_USER", "root");
const SSH_PASSWORD = env("SSH_PASSWORD");
const SSH_PRIVATE_KEY = env("SSH_PRIVATE_KEY");

export async function runSSH(command: string): Promise<{ code: number; stdout: string; stderr: string }> {
  if (!SSH_HOST) throw new Error("SSH_HOST not configured");
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const cfg: any = { host: SSH_HOST, port: SSH_PORT, username: SSH_USER };
    if (SSH_PRIVATE_KEY && SSH_PRIVATE_KEY.includes("BEGIN")) cfg.privateKey = SSH_PRIVATE_KEY;
    else if (SSH_PASSWORD) cfg.password = SSH_PASSWORD;
    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          let stdout = "";
          let stderr = "";
          stream
            .on("close", (code: number) => {
              conn.end();
              resolve({ code: code ?? 0, stdout, stderr });
            })
            .on("data", (data: Buffer) => (stdout += data.toString()))
            .stderr.on("data", (data: Buffer) => (stderr += data.toString()));
        });
      })
      .on("error", (e) => reject(e))
      .connect(cfg);
  });
}

export async function getServiceState(name: "nginx" | "docker"): Promise<"running" | "stopped"> {
  const cmd = name === "docker" ? "systemctl is-active docker || echo inactive" : "systemctl is-active nginx || echo inactive";
  const { stdout } = await runSSH(cmd);
  const res = stdout.trim();
  return res === "active" ? "running" : "stopped";
}

export async function installNginxRemote() {
  const script = `set -e; if ! command -v apt >/dev/null; then echo not-debian; exit 1; fi; apt update -y; apt install -y nginx; systemctl enable nginx; systemctl restart nginx`;
  return runSSH(`bash -lc '${script}'`);
}

export async function restartNginxRemote() {
  return runSSH("systemctl restart nginx");
}

export async function restartDockerRemote() {
  return runSSH("systemctl restart docker");
}
