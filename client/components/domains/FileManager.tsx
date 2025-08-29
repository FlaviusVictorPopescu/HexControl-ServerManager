import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/lib/api";
import type { Domain } from "@shared/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function FileManager({ domain }: { domain: Domain }) {
  const qc = useQueryClient();
  const { data: files = [], isLoading } = useQuery({ queryKey: ["files", domain.id], queryFn: () => Api.listFiles(domain.id) });

  const [name, setName] = useState("");

  const upload = useMutation({
    mutationFn: () => Api.uploadFile(domain.id, { name, size: Math.floor(Math.random()*5000)+100, path: `/var/www/${domain.name}/${name}` }),
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["files", domain.id] }); },
  });
  const del = useMutation({
    mutationFn: (fileId: string) => Api.deleteFile(domain.id, fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", domain.id] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Manager — {domain.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="grid gap-2 flex-1">
            <Label htmlFor="filename">New File</Label>
            <Input id="filename" placeholder="app.config.json" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={() => upload.mutate()} disabled={!name}>Upload</Button>
        </div>
        <div className="mt-4 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (<TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">Loading...</TableCell></TableRow>)}
              {!isLoading && files.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-muted-foreground">{f.path}</TableCell>
                  <TableCell>{(f.size/1024).toFixed(1)} KB</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="destructive" onClick={() => del.mutate(f.id)}>Delete</Button></TableCell>
                </TableRow>
              ))}
              {!isLoading && files.length === 0 && (<TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No files</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
