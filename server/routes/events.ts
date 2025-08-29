import type { RequestHandler } from "express";
import { recentActivities, subscribe } from "../services/store";

export const sseEvents: RequestHandler = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Send recent activities upon connect
  const initial = recentActivities(25);
  res.write(`data: ${JSON.stringify({ type: "seed", events: initial })}\n\n`);

  const unsubscribe = subscribe((evt) => {
    res.write(`data: ${JSON.stringify({ type: "event", event: evt })}\n\n`);
  });

  req.on("close", () => {
    unsubscribe();
  });
};
