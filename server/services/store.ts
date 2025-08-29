import { randomUUID } from "node:crypto";
import type { ActivityEvent, CreateDomainInput, Domain, FileEntry, ServicesStatus, UpdateDomainInput } from "@shared/api";

// In-memory stores (can be swapped with Mongo later)
const domains = new Map<string, Domain>();
const files = new Map<string, FileEntry[]>(); // key: domainId
const activities: ActivityEvent[] = [];
const sessions = new Set<string>();
let services: ServicesStatus = { nginx: "running", docker: "running" };

// SSE subscribers
type Subscriber = { id: string; send: (data: ActivityEvent) => void };
const subscribers = new Map<string, Subscriber>();

function now() {
  return new Date().toISOString();
}

export function listDomains(): Domain[] {
  return Array.from(domains.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getDomain(id: string): Domain | undefined {
  return domains.get(id);
}

export function createDomain(input: CreateDomainInput): Domain {
  const id = randomUUID();
  const isSubdomain = Boolean(input.isSubdomain || (input.name.includes(".") && input.name.split(".").length > 2));
  const domain: Domain = {
    id,
    name: input.name.trim(),
    isSubdomain,
    parentDomainId: input.parentDomainId ?? null,
    nodeVersion: input.nodeVersion,
    dockerContainer: input.dockerContainer ?? null,
    nginxProxy: input.nginxProxy ?? null,
    sslEnabled: Boolean(input.sslEnabled ?? true),
    sslStatus: input.sslEnabled === false ? "none" : "pending",
    createdAt: now(),
    updatedAt: now(),
  };
  domains.set(id, domain);
  files.set(id, []);
  pushActivity({
    kind: "domain.created",
    message: `Domain ${domain.name} created`,
    domainId: id,
  });
  return domain;
}

export function updateDomain(id: string, patch: UpdateDomainInput): Domain | undefined {
  const current = domains.get(id);
  if (!current) return undefined;
  const next: Domain = {
    ...current,
    ...patch,
    sslStatus:
      patch.sslEnabled === false ? "none" : patch.sslEnabled === true && current.sslStatus === "none" ? "pending" : current.sslStatus,
    updatedAt: now(),
  } as Domain;
  domains.set(id, next);
  pushActivity({ kind: "domain.updated", message: `Domain ${next.name} updated`, domainId: id });
  return next;
}

export function deleteDomain(id: string): boolean {
  const d = domains.get(id);
  if (!d) return false;
  domains.delete(id);
  files.delete(id);
  pushActivity({ kind: "domain.deleted", message: `Domain ${d.name} deleted`, domainId: id });
  return true;
}

export function listFiles(domainId: string): FileEntry[] {
  return files.get(domainId) ?? [];
}

export function addFile(domainId: string, name: string, size: number, path: string, isDirectory = false): FileEntry | undefined {
  if (!domains.has(domainId)) return undefined;
  const entry: FileEntry = { id: randomUUID(), name, size, path, updatedAt: now(), isDirectory };
  const arr = files.get(domainId) ?? [];
  arr.push(entry);
  files.set(domainId, arr);
  pushActivity({ kind: "file.uploaded", message: `${name} uploaded to ${domains.get(domainId)!.name}`, domainId });
  return entry;
}

export function deleteFile(domainId: string, fileId: string): boolean {
  const arr = files.get(domainId);
  if (!arr) return false;
  const idx = arr.findIndex((f) => f.id === fileId);
  if (idx === -1) return false;
  const [removed] = arr.splice(idx, 1);
  files.set(domainId, arr);
  pushActivity({ kind: "file.deleted", message: `${removed.name} deleted from ${domains.get(domainId)!.name}`, domainId });
  return true;
}

export function pushActivity(partial: Omit<ActivityEvent, "id" | "createdAt">) {
  const evt: ActivityEvent = { id: randomUUID(), createdAt: now(), ...partial };
  activities.unshift(evt);
  subscribers.forEach((s) => s.send(evt));
}

export function recentActivities(limit = 50): ActivityEvent[] {
  return activities.slice(0, limit);
}

export function subscribe(send: (data: ActivityEvent) => void): () => void {
  const id = randomUUID();
  const sub: Subscriber = { id, send };
  subscribers.set(id, sub);
  return () => subscribers.delete(id);
}

// Seed some demo data for a nice first-run experience
(function seed() {
  if (domains.size > 0) return;
  const d1 = createDomain({ name: "hexbit.ro", nodeVersion: "20", nginxProxy: "http://localhost:3000", sslEnabled: true });
  const d2 = createDomain({ name: "api.hexbit.ro", isSubdomain: true, parentDomainId: d1.id, nodeVersion: "22", dockerContainer: "api:1.2.0" });
  updateDomain(d1.id, { sslEnabled: true });
  addFile(d1.id, "index.html", 2048, "/var/www/hexbit.ro/index.html");
  addFile(d1.id, "assets", 0, "/var/www/hexbit.ro/assets", true);
})();
