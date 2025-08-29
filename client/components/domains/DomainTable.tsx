import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Domain } from "@shared/api";
import { DomainFormDialog } from "./DomainFormDialog";

import { Api } from "@/lib/api";

export function DomainTable({ domains, onEdit, onDelete }: { domains: Domain[]; onEdit: (domain: Domain, patch: Partial<Domain>) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState<Domain | null>(null);

  const items = useMemo(() => domains, [domains]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Node</TableHead>
            <TableHead>SSL</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Docker</TableHead>
            <TableHead>Nginx</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell>{d.isSubdomain ? <Badge variant="outline">Subdomain</Badge> : <Badge>Domain</Badge>}</TableCell>
              <TableCell><Badge variant="secondary">{d.nodeVersion}</Badge></TableCell>
              <TableCell>
                {d.sslEnabled ? (
                  <Badge className={d.sslStatus === "issued" ? "bg-emerald-600" : d.sslStatus === "failed" ? "bg-red-600" : "bg-amber-500"}>
                    {d.sslStatus}
                  </Badge>
                ) : (
                  <Badge variant="outline">disabled</Badge>
                )}
              </TableCell>
              <TableCell>
                <Expiry domain={d.name} />
              </TableCell>
              <TableCell>{d.dockerContainer ? <Badge variant="outline">{d.dockerContainer}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>{d.nginxProxy ? <span className="text-muted-foreground">{d.nginxProxy}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell className="text-right space-x-2">
                <DomainFormDialog initial={editing ?? d} onSubmit={async (input) => { onEdit(d, input as any); }}
                  trigger={<Button size="sm" variant="outline" onClick={() => setEditing(d)}>Edit</Button>} />
                <Button size="sm" variant="outline" onClick={() => onEdit(d, { autoSslEnabled: !(d as any).autoSslEnabled })}>
                  {(d as any).autoSslEnabled ? "Auto SSL: On" : "Auto SSL: Off"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(d.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Expiry({ domain }: { domain: string }) {
  const [exp, setExp] = useState<string | null | undefined>(undefined);
  React.useEffect(() => {
    let active = true;
    Api.certExpiry(domain).then((r) => active && setExp(r.expiresAt)).catch(() => active && setExp(null));
    return () => { active = false; };
  }, [domain]);
  if (exp === undefined) return <span className="text-xs text-muted-foreground">…</span>;
  if (!exp) return <span className="text-xs text-muted-foreground">none</span>;
  const d = new Date(exp);
  const days = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return <span className={days < 15 ? "text-red-600 text-xs" : "text-xs text-muted-foreground"}>{d.toLocaleDateString()} ({days}d)</span>;
}
