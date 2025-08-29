import type { RequestHandler } from "express";

const nginxScript = `#!/usr/bin/env bash
set -euo pipefail
if ! command -v apt >/dev/null 2>&1; then echo "This script supports Debian/Ubuntu (apt) only"; exit 1; fi
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
echo "Nginx installed and started"
`;

const dockerComposeScript = `#!/usr/bin/env bash
set -euo pipefail
if ! command -v curl >/dev/null 2>&1; then sudo apt update && sudo apt install -y curl; fi
if ! command -v docker >/dev/null 2>&1; then curl -fsSL https://get.docker.com | sh; fi
COMPOSE_VERSION=2.29.7
sudo curl -L "https://github.com/docker/compose/releases/download/v$COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
echo "Docker Compose installed"
`;

export const getNginxScript: RequestHandler = (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(nginxScript);
};

export const getDockerComposeScript: RequestHandler = (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(dockerComposeScript);
};
