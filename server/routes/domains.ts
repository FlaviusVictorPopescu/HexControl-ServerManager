import type { RequestHandler } from "express";
import type { CreateDomainInput, UpdateDomainInput } from "@shared/api";
import {
  createDomain,
  deleteDomain,
  getDomain,
  listDomains,
  updateDomain,
} from "../services/store";

export const getDomains: RequestHandler = (_req, res) => {
  res.json(listDomains());
};

import { issueSslForDomain } from "../services/nginx-utils";

export const postDomain: RequestHandler = (req, res) => {
  const body = req.body as CreateDomainInput;
  if (!body?.name || !body?.nodeVersion) {
    return res.status(400).json({ error: "name and nodeVersion are required" });
  }
  const created = createDomain(body);
  // Auto-SSL async if desired
  if (created.sslEnabled) {
    issueSslForDomain(created.name).catch(() => {});
  }
  res.status(201).json(created);
};

export const putDomain: RequestHandler = (req, res) => {
  const id = req.params.id;
  const patch = req.body as UpdateDomainInput;
  const updated = updateDomain(id, patch);
  if (!updated) return res.status(404).json({ error: "Domain not found" });
  res.json(updated);
};

export const deleteDomainHandler: RequestHandler = (req, res) => {
  const id = req.params.id;
  const ok = deleteDomain(id);
  if (!ok) return res.status(404).json({ error: "Domain not found" });
  res.status(204).end();
};

export const getDomainById: RequestHandler = (req, res) => {
  const id = req.params.id;
  const domain = getDomain(id);
  if (!domain) return res.status(404).json({ error: "Domain not found" });
  res.json(domain);
};
