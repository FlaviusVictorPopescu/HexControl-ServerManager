import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateDomainInput, Domain, NodeVersion } from "@shared/api";

export function DomainFormDialog({ onSubmit, trigger, initial }: { onSubmit: (input: CreateDomainInput, id?: string) => Promise<void> | void; trigger?: React.ReactNode; initial?: Domain | null }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nodeVersion, setNodeVersion] = useState<NodeVersion>("20");
  const [sslEnabled, setSslEnabled] = useState(true);
  const [dockerContainer, setDockerContainer] = useState("");
  const [nginxProxy, setNginxProxy] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setNodeVersion(initial.nodeVersion);
      setSslEnabled(initial.sslEnabled);
      setDockerContainer(initial.dockerContainer ?? "");
      setNginxProxy(initial.nginxProxy ?? "");
    } else {
      setName("");
      setNodeVersion("20");
      setSslEnabled(true);
      setDockerContainer("");
      setNginxProxy("");
    }
  }, [initial, open]);

  const submit = async () => {
    await onSubmit({ name, nodeVersion, sslEnabled, dockerContainer: dockerContainer || null, nginxProxy: nginxProxy || null }, initial?.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : <DialogTrigger asChild><Button variant="default">Add Domain</Button></DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Domain" : "Add Domain"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Domain / Subdomain</Label>
            <Input id="name" placeholder="example.com or api.example.com" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Node Version</Label>
            <Select value={nodeVersion} onValueChange={(v) => setNodeVersion(v as NodeVersion)}>
              <SelectTrigger><SelectValue placeholder="Select version" /></SelectTrigger>
              <SelectContent>
                {(["16","18","20","22"] as NodeVersion[]).map(v => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nginx">Nginx Upstream (optional)</Label>
            <Input id="nginx" placeholder="http://localhost:3000" value={nginxProxy} onChange={(e) => setNginxProxy(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="docker">Docker Container (optional)</Label>
            <Input id="docker" placeholder="web:latest" value={dockerContainer} onChange={(e) => setDockerContainer(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto SSL (certbot)</Label>
              <p className="text-xs text-muted-foreground">Request certificate automatically</p>
            </div>
            <Switch checked={sslEnabled} onCheckedChange={setSslEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>{initial ? "Save Changes" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
