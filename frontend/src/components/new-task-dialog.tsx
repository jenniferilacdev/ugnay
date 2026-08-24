"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";

import { ApiError, createTask, getOrganizations, getUsers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
const UNASSIGNED = "unassigned";

export function NewTaskDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState(UNASSIGNED);

  const barangays = useQuery({
    queryKey: ["organizations", "flat", "Barangay"],
    queryFn: ({ signal }) => getOrganizations("Barangay", signal),
  });
  const users = useQuery({ queryKey: ["users"], queryFn: ({ signal }) => getUsers(undefined, signal) });

  const mutation = useMutation({
    mutationFn: () =>
      createTask({
        organizationId,
        title,
        notes: notes || null,
        priority,
        dueDate: dueDate || null,
        assignedToUserId: assignee === UNASSIGNED ? null : assignee,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setOpen(false);
      setTitle("");
      setNotes("");
      setDueDate("");
      setOrganizationId("");
      setAssignee(UNASSIGNED);
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not create task."
        : null;

  const canSubmit = organizationId && title.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon />
            New task
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>An internal work item for staff (spec §57).</DialogDescription>
        </DialogHeader>

        <form
          id="new-task-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v ?? "Normal")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="due">Due date</Label>
              <DatePicker id="due" value={dueDate} onChange={setDueDate} placeholder="Select due date" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Barangay</Label>
            <Select value={organizationId} onValueChange={(v) => setOrganizationId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select barangay">
                  {(value) => (value ? (barangays.data?.find((b) => b.id === value)?.name ?? "") : "Select barangay")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {barangays.data?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Assignee</Label>
            <Select value={assignee} onValueChange={(v) => setAssignee(v ?? UNASSIGNED)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {users.data?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.fullName ?? u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form="new-task-form" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
