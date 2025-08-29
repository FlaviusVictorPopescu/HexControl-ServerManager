import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import * as React from "react";

export default function DockerPage() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["docker", "list"],
    queryFn: Api.dockerList,
  });

  const install = useMutation({
    mutationFn: () => Api.dockerInstall(),
    onSuccess: () => list.refetch(),
  });
  const create = useMutation({
    mutationFn: (p: {
      name: string;
      image: string;
      portHost?: number;
      portContainer?: number;
    }) => Api.dockerCreate(p.name, p.image, p.portHost, p.portContainer),
    onSuccess: () => list.refetch(),
  });
  const del = useMutation({
    mutationFn: (id: string) => Api.dockerDelete(id),
    onSuccess: () => list.refetch(),
  });
  const assign = useMutation({
    mutationFn: (p: { domain: string; port: number }) =>
      Api.dockerAssign(p.domain, p.port),
    onSuccess: () => {},
  });

  const [name, setName] = React.useState("");
  const [image, setImage] = React.useState("nginxdemos/hello");
  const [host, setHost] = React.useState("8081");
  const [container, setContainer] = React.useState("80");
  const [assignDomain, setAssignDomain] = React.useState("");
  const [assignPort, setAssignPort] = React.useState("8081");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Docker</h1>
        <div className="space-x-2">
          <Button onClick={() => install.mutate()} variant="outline">
            Install / Update
          </Button>
          <Button onClick={() => list.refetch()} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Containers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ports</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data || []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.image}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.status}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.ports || "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => del.mutate(c.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {list.data && list.data.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-sm text-muted-foreground"
                    >
                      No containers
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
          <CardTitle>Create Container</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <Input
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          <Input
            placeholder="host port"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
          <Input
            placeholder="container port"
            value={container}
            onChange={(e) => setContainer(e.target.value)}
          />
          <Button
            onClick={() =>
              create.mutate({
                name,
                image,
                portHost: Number(host),
                portContainer: Number(container),
              })
            }
            disabled={!name || !image}
          >
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign to Domain/Subdomain</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="domain e.g. app.example.com"
            value={assignDomain}
            onChange={(e) => setAssignDomain(e.target.value)}
          />
          <Input
            placeholder="container host port e.g. 8081"
            value={assignPort}
            onChange={(e) => setAssignPort(e.target.value)}
          />
          <Button
            onClick={() =>
              assign.mutate({ domain: assignDomain, port: Number(assignPort) })
            }
            disabled={!assignDomain || !assignPort}
          >
            Assign
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
