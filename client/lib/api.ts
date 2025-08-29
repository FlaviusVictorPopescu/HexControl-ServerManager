import type { ActivityEvent, CreateDomainInput, Domain, FileEntry, UpdateDomainInput } from "@shared/api";

function token() {
  try { return localStorage.getItem("auth_token"); } catch { return null; }
}
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const t = token();
  if (t) headers["Authorization"] = `Bearer ${t}`;
  const res = await fetch(path, { headers, ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const Api = {
  listDomains: () => http<Domain[]>("/api/domains"),
  createDomain: (input: CreateDomainInput) => http<Domain>("/api/domains", { method: "POST", body: JSON.stringify(input) }),
  updateDomain: (id: string, patch: UpdateDomainInput) => http<Domain>(`/api/domains/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteDomain: (id: string) => fetch(`/api/domains/${id}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error("Failed to delete");
  }),
  listFiles: (domainId: string) => http<FileEntry[]>(`/api/domains/${domainId}/files`),
  uploadFile: (domainId: string, file: { name: string; size: number; path: string; isDirectory?: boolean }) =>
    http<FileEntry>(`/api/domains/${domainId}/files`, { method: "POST", body: JSON.stringify(file) }),
  deleteFile: (domainId: string, fileId: string) => fetch(`/api/domains/${domainId}/files/${fileId}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error("Failed to delete file");
  }),
  subscribeEvents: (onEvent: (e: ActivityEvent) => void, onSeed?: (events: ActivityEvent[]) => void) => {
    const es = new EventSource("/api/events");
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "seed" && onSeed) onSeed(data.events as ActivityEvent[]);
        if (data.type === "event") onEvent(data.event as ActivityEvent);
      } catch (e) {
        // ignore
      }
    };
    return () => es.close();
  },
  installNginx: () => fetch("/api/nginx/install", { method: "POST" }).then(() => {}),
  restartNginx: () => fetch("/api/nginx/restart", { method: "POST" }).then(() => {}),
  restartDocker: () => fetch("/api/docker/restart", { method: "POST" }).then(() => {}),
};
