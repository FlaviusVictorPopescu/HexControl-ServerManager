import type { RequestHandler } from "express";
import { addFile, deleteFile, listFiles } from "../services/store";

export const listFilesHandler: RequestHandler = (req, res) => {
  const domainId = req.params.domainId;
  res.json(listFiles(domainId));
};

export const uploadFileHandler: RequestHandler = (req, res) => {
  const domainId = req.params.domainId;
  const { name, size, path, isDirectory } = req.body as {
    name: string;
    size: number;
    path: string;
    isDirectory?: boolean;
  };
  if (!name || typeof size !== "number" || !path) {
    return res.status(400).json({ error: "name, size and path are required" });
  }
  const entry = addFile(domainId, name, size, path, Boolean(isDirectory));
  if (!entry) return res.status(404).json({ error: "Domain not found" });
  res.status(201).json(entry);
};

export const deleteFileHandler: RequestHandler = (req, res) => {
  const domainId = req.params.domainId;
  const fileId = req.params.fileId;
  const ok = deleteFile(domainId, fileId);
  if (!ok) return res.status(404).json({ error: "File or domain not found" });
  res.status(204).end();
};
