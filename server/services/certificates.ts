import { runSSH } from "./remote";

export async function fetchCertExpiryISO(domain: string): Promise<string | null> {
  const safe = domain.replace(/[^a-zA-Z0-9.-]/g, "");
  const path = `/etc/letsencrypt/live/${safe}/fullchain.pem`;
  try {
    const { stdout } = await runSSH(`bash -lc 'openssl x509 -enddate -noout -in ${path}'`);
    const line = stdout.trim();
    const m = line.match(/notAfter=(.*)/);
    const txt = m ? m[1].trim() : line.replace(/^notAfter=/, "");
    const date = new Date(txt);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}
