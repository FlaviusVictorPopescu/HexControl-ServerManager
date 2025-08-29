import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DomainFormDialog } from "@/components/domains/DomainFormDialog";
import type { NginxSiteSummary } from "@shared/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NginxPage() {
  const qc = useQueryClient();
  const sites = useQuery({
    queryKey: ["nginx", "sites"],
    queryFn: Api.listNginxSites,
  });
  const config = useQuery({
    queryKey: ["nginx", "config"],
    queryFn: Api.getNginxConfig,
  });

  const restart = useMutation({
    mutationFn: () => Api.restartNginx(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nginx"] }),
  });

  React.useEffect(() => {
    const unsub = Api.subscribeEvents((e) => {
      if (
        [
          "domain.updated",
          "ssl.issued",
          "ssl.failed",
          "nginx.restarted",
        ].includes(e.kind)
      ) {
        sites.refetch();
        config.refetch();
      }
    });
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Nginx</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => restart.mutate()}>
            Restart
          </Button>
          <ProxyDialog
            onSaved={() => qc.invalidateQueries({ queryKey: ["nginx"] })}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enabled Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Server Name</TableHead>
                  <TableHead>Upstream</TableHead>
                  <TableHead>Listens</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sites.data || []).map((s: NginxSiteSummary) => (
                  <TableRow key={s.file}>
                    <TableCell className="font-medium">
                      {s.serverName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.upstream || "—"}
                    </TableCell>
                    <TableCell>{s.listens.join(", ")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.file}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {s.enabled ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            Api.disableSite(
                              s.serverName ||
                                s.file.split("/").pop()?.replace(".conf", "") ||
                                "",
                            ).then(() => sites.refetch())
                          }
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            Api.enableSite(
                              s.serverName ||
                                s.file.split("/").pop()?.replace(".conf", "") ||
                                "",
                            ).then(() => sites.refetch())
                          }
                        >
                          Enable
                        </Button>
                      )}
                      {s.serverName && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            Api.issueSSL(s.serverName).then(() =>
                              sites.refetch(),
                            )
                          }
                        >
                          Issue SSL
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {sites.data && sites.data.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-sm text-muted-foreground"
                    >
                      No sites found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>nginx.conf</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap">
            {config.data}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

import * as React from "react";

function ProxyDialog({ onSaved }: { onSaved: () => void }) {
  const [domain, setDomain] = React.useState("");
  const [upstream, setUpstream] = React.useState("http://localhost:3000");
  const [open, setOpen] = React.useState(false);
  const save = useMutation({
    mutationFn: () => Api.setNginxProxy(domain.trim(), upstream.trim()),
    onSuccess: () => {
      onSaved();
      setOpen(false);
    },
    onError: () =>
      alert(
        "Failed to configure proxy. Ensure SSH access and permissions are correct.",
      ),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Configure Proxy</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Proxy</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="d">Domain</Label>
            <Input
              id="d"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="u">Upstream URL</Label>
            <Input
              id="u"
              placeholder="http://localhost:3000"
              value={upstream}
              onChange={(e) => setUpstream(e.target.value)}
            />
          </div>
          <Button
            onClick={() => save.mutate()}
            disabled={!domain || !upstream || save.isPending}
          >
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
