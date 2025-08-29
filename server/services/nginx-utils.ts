import { runSSH } from "./remote";
import { pushActivity } from "./store";

export async function issueSslForDomain(name: string, email = process.env.CERTBOT_EMAIL || "admin@hexbit.ro") {
  const safe = name.replace(/[^a-zA-Z0-9.-]/g, "");
  try {
    const install = `bash -lc 'if ! command -v certbot >/dev/null; then apt update -y && apt install -y certbot python3-certbot-nginx; fi'`;
    await runSSH(install);
    const cmd = `bash -lc 'certbot --nginx -n --agree-tos -m ${email} -d ${safe} || true'`;
    const { stdout, stderr } = await runSSH(cmd);
    pushActivity({ kind: "ssl.issued", message: `Certbot attempted for ${safe}`, meta: { stdout, stderr } });
  } catch (e: any) {
    pushActivity({ kind: "ssl.failed", message: `Certbot failed for ${safe}`, meta: { error: String(e?.message || e) } });
    throw e;
  }
}
