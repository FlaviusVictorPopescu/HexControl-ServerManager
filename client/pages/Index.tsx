import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DomainFormDialog } from "@/components/domains/DomainFormDialog";
import { DomainTable } from "@/components/domains/DomainTable";
import { ActivityFeed } from "@/components/domains/ActivityFeed";
import type { CreateDomainInput, Domain } from "@shared/api";
import { Rocket, ShieldCheck, Network, Wrench } from "lucide-react";

export default function Index() {
  const qc = useQueryClient();
  const { data: domains = [] } = useQuery({ queryKey: ["domains"], queryFn: Api.listDomains });
  const create = useMutation({ mutationFn: (input: CreateDomainInput) => Api.createDomain(input), onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }) });
  const update = useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Partial<Domain> }) => Api.updateDomain(id, patch), onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }) });
  const remove = useMutation({ mutationFn: (id: string) => Api.deleteDomain(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }) });

  const stats = useMemo(() => {
    const total = domains.length;
    const sub = domains.filter((d) => d.isSubdomain).length;
    const ssl = domains.filter((d) => d.sslStatus === "issued").length;
    const docker = domains.filter((d) => d.dockerContainer).length;
    return { total, sub, ssl, docker };
  }, [domains]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Server Dashboard</h1>
          <p className="text-muted-foreground">Vite + Node.js + React + Tailwind + Mongo-ready with real-time updates</p>
        </div>
        <DomainFormDialog onSubmit={async (input) => create.mutateAsync(input)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Domains" value={stats.total} icon={<Network className="h-5 w-5" />} />
        <StatCard title="Subdomains" value={stats.sub} icon={<Wrench className="h-5 w-5" />} />
        <StatCard title="SSL Issued" value={stats.ssl} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard title="Docker-Assigned" value={stats.docker} icon={<Rocket className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Domains</CardTitle>
            <div className="space-x-2">
              <DomainFormDialog onSubmit={async (input) => create.mutateAsync(input)} trigger={<Button size="sm">Add</Button>} />
              <Button size="sm" variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["domains"] })}>Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            <DomainTable
              domains={domains}
              onEdit={(d, patch) => update.mutateAsync({ id: d.id, patch })}
              onDelete={(id) => remove.mutateAsync(id)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>One‑click Operations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button variant="outline" className="justify-start" onClick={() => Api.installNginx()}>Install Nginx</Button>
          <Button variant="outline" className="justify-start" onClick={() => Api.restartNginx()}>Restart Nginx</Button>
          <Button variant="outline" className="justify-start" onClick={() => Api.restartDocker()}>Restart Docker</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary/70">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
