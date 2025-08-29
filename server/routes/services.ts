import type { RequestHandler } from "express";
import { getServicesStatus } from "../services/store";

export const getServices: RequestHandler = (_req, res) => {
  res.json(getServicesStatus());
};
