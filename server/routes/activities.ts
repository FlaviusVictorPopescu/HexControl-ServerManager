import type { RequestHandler } from "express";
import { fetchActivities } from "../services/db";

export const listActivities: RequestHandler = (req, res) => {
  const limit = Number(req.query.limit ?? 100);
  res.json(fetchActivities(limit));
};
