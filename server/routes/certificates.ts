import type { RequestHandler } from "express";
import { fetchCertExpiryISO } from "../services/certificates";

export const getCertExpiry: RequestHandler = async (req, res) => {
  const domain = String(req.query.domain || req.body?.domain || "");
  if (!domain) return res.status(400).json({ error: "domain is required" });
  const iso = await fetchCertExpiryISO(domain);
  res.json({ domain, expiresAt: iso });
};
