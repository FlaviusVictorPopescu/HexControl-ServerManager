/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export type NodeVersion = "16" | "18" | "20" | "22";

export interface Domain {
  id: string;
  name: string; // e.g. example.com or api.example.com
  isSubdomain: boolean;
  parentDomainId?: string | null;
  nodeVersion: NodeVersion;
  sslEnabled: boolean;
  autoSslEnabled?: boolean;
  sslStatus: "pending" | "issued" | "failed" | "none";
  certExpiresAt?: string | null; // ISO date when available
  dockerContainer?: string | null;
  nginxProxy?: string | null; // e.g. http://localhost:3000
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface FileEntry {
  id: string;
  name: string;
  size: number; // bytes
  path: string; // virtual path for this demo
  updatedAt: string;
  isDirectory: boolean;
}

export type ActivityKind =
  | "domain.created"
  | "domain.updated"
  | "domain.deleted"
  | "nginx.installed"
  | "nginx.restarted"
  | "docker.assigned"
  | "docker.restarted"
  | "file.uploaded"
  | "file.deleted"
  | "ssl.issued"
  | "ssl.failed"
  | "service.status";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  createdAt: string; // ISO date
  domainId?: string;
  meta?: Record<string, any>;
}

export type ServiceName = "nginx" | "docker";
export type ServiceState = "running" | "stopped" | "restarting";
export interface ServicesStatus {
  nginx: ServiceState;
  docker: ServiceState;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface NginxSiteSummary {
  file: string;
  serverName: string;
  listens: string[];
  upstream: string | null;
  enabled: boolean;
}

export interface DockerContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string; // running, exited, etc
  ports: string; // raw port mapping string
}

export interface CreateDomainInput {
  name: string;
  isSubdomain?: boolean;
  parentDomainId?: string | null;
  nodeVersion: NodeVersion;
  dockerContainer?: string | null;
  nginxProxy?: string | null;
  sslEnabled?: boolean;
  autoSslEnabled?: boolean;
}

export interface UpdateDomainInput extends Partial<CreateDomainInput> {}
