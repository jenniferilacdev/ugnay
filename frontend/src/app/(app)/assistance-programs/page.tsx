"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";

import {
  ApiError,
  createAssistanceProgram,
  getAssistancePrograms,
  removeAssistanceProgram,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AssistanceProgramsPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const query = useQuery({
    queryKey: ["assistance-programs"],
    queryFn: ({ signal }) => getAssistancePrograms(signal),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["assistance-programs"] });

  const add = useMutation({
    mutationFn: () => createAssistanceProgram({ code, name }),
    onSuccess: () => { invalidate(); setCode(""); setName(""); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeAssistanceProgram(id),
    onSuccess: invalidate,
  });

  const addError = add.error instanceof ApiError ? add.error.message : add.error ? "Could not add program." : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assistance Programs</h1>
        <p className="text-sm text-muted-foreground">
          Social-assistance programs residents can be enrolled in (spec §43).
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Add program</CardTitle></CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim() && name.trim()) add.mutate();
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" className="w-32" placeholder="e.g. 4Ps" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="flex min-w-64 flex-1 flex-col gap-2">
              <Label htmlFor="name">Program</Label>
              <Input id="name" placeholder="e.g. Pantawid Pamilyang Pilipino" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button type="submit" size="sm" disabled={!code.trim() || !name.trim() || add.isPending}>
              <PlusIcon /> Add
            </Button>
          </form>
          {addError && <p role="alert" className="mt-2 text-sm text-destructive">{addError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Code</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending && (
                <TableRow><TableCell colSpan={3} className="text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {query.data?.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-muted-foreground">No programs yet.</TableCell></TableRow>
              )}
              {query.data?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon-sm" variant="ghost" onClick={() => remove.mutate(p.id)} disabled={remove.isPending}>
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
