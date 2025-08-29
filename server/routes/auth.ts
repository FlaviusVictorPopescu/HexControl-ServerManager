import type { RequestHandler } from "express";
import {
  createSession,
  isValidSession,
  revokeSession,
} from "../services/store";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@hexbit.ro";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "hexbit2025";

export const login: RequestHandler = (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = createSession();
    return res.json({ token, user: { email } });
  }
  return res.status(401).json({ error: "Invalid credentials" });
};

export const me: RequestHandler = (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!isValidSession(token))
    return res.status(401).json({ error: "Unauthorized" });
  res.json({ ok: true });
};

export const logout: RequestHandler = (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (token) revokeSession(token);
  res.status(204).end();
};
