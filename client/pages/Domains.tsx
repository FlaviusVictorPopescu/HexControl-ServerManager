import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DomainFormDialog } from "@/components/domains/DomainFormDialog";
import { DomainTable } from "@/components/domains/DomainTable";
import type { CreateDomainInput, Domain } from "@shared/api";

export default function Domains() {
  const qc = useQueryClient();
  const { data: domains = [], isLoading } = useQuery({ queryKey: ["domains"], queryFn: Api.listDomains });

  const create = useMutation({
    mutationFn: (input: CreateDomainInput) => Api.createDomain(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }),
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Domain> }) => Api.updateDomain(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => Api.deleteDomain(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Domains</h1>
        <DomainFormDialog onSubmit={async (input) => create.mutateAsync(input)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Domains & Subdomains</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <DomainTable
              domains={domains}
              onEdit={(d, patch) => update.mutateAsync({ id: d.id, patch })}
              onDelete={(id) => remove.mutateAsync(id)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
