"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPinIcon } from "lucide-react";

import { getOrganizationTree, type OrganizationNode } from "@/lib/api";
import { useActingScope } from "@/lib/scope-context";
import { useMe } from "@/lib/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

type Municipality = {
  id: string;
  name: string;
  barangays: { id: string; name: string }[];
};

/** Collects every City/Municipality node in the tree with its barangay children. */
function collectMunicipalities(nodes: OrganizationNode[]): Municipality[] {
  const out: Municipality[] = [];
  const walk = (list: OrganizationNode[]) => {
    for (const node of list) {
      if (node.type === "City" || node.type === "Municipality") {
        out.push({
          id: node.id,
          name: node.name,
          barangays: node.children
            .filter((c) => c.type === "Barangay")
            .map((c) => ({ id: c.id, name: c.name })),
        });
      }
      if (node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

function findNode(nodes: OrganizationNode[], id: string): OrganizationNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Header control for focusing the dashboard on a city/municipality and barangay.
 * Behaviour depends on the signed-in account's scope:
 *  - Province / super-admin: choose any municipality, then optionally a barangay.
 *  - City / municipal: their municipality is fixed; they choose a barangay.
 *  - Barangay: their municipality and barangay are shown as read-only context.
 * The chosen organization id flows through {@link useActingScope} into list queries.
 */
export function ScopeSelector() {
  const { actingOrgId, setActingOrgId } = useActingScope();
  const me = useMe();
  const tree = useQuery({
    queryKey: ["organization-tree"],
    queryFn: ({ signal }) => getOrganizationTree(signal),
    staleTime: 5 * 60 * 1000,
  });

  const nodes = useMemo(() => tree.data ?? [], [tree.data]);
  const scopeIds = useMemo(
    () => me.data?.scopeOrganizationIds ?? [],
    [me.data?.scopeOrganizationIds],
  );

  const scopeNode = useMemo(() => {
    for (const id of scopeIds) {
      const node = findNode(nodes, id);
      if (node) return node;
    }
    return null;
  }, [nodes, scopeIds]);

  const municipalities = useMemo(() => collectMunicipalities(nodes), [nodes]);

  // Which municipality the current selection belongs to.
  const activeMunicipality = useMemo(
    () =>
      municipalities.find(
        (m) => m.id === actingOrgId || m.barangays.some((b) => b.id === actingOrgId),
      ) ?? null,
    [municipalities, actingOrgId],
  );

  if (municipalities.length === 0) return null;

  const level = scopeNode?.type;
  const isProvince = level === "Province";
  const provinceName = isProvince ? scopeNode?.name : null;

  // For non-province accounts the municipality is fixed to the one in their tree.
  const homeMunicipality = isProvince ? activeMunicipality : municipalities[0];
  const barangayList = homeMunicipality?.barangays ?? [];
  const activeBarangayId = barangayList.some((b) => b.id === actingOrgId)
    ? actingOrgId
    : null;

  const onMunicipalityChange = (value: string | null) => {
    setActingOrgId(!value || value === ALL ? null : value);
  };

  const onBarangayChange = (value: string | null) => {
    // A barangay selection is always a real scope; "all" clears back to the
    // account's own scope (null → the server resolves the full visible set).
    setActingOrgId(!value || value === ALL ? (isProvince ? homeMunicipality?.id ?? null : null) : value);
  };

  return (
    <div className="flex items-center gap-2">
      <MapPinIcon className="size-4 text-muted-foreground" />

      {provinceName && (
        <span className="hidden text-sm font-medium text-muted-foreground md:inline">
          {provinceName}
        </span>
      )}

      {isProvince ? (
        <Select value={activeMunicipality?.id ?? ALL} onValueChange={onMunicipalityChange}>
          <SelectTrigger size="sm" className="min-w-40">
            <SelectValue placeholder="All municipalities">
              {(value) =>
                value && value !== ALL
                  ? municipalities.find((m) => m.id === value)?.name ?? "All municipalities"
                  : "All municipalities"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All municipalities</SelectItem>
            {municipalities.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="flex h-7 items-center rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground">
          {homeMunicipality?.name}
        </span>
      )}

      {/* Barangay picker: province accounts see it only after choosing a
          municipality; city/barangay accounts always see it. */}
      {homeMunicipality && barangayList.length > 0 && (
        <Select value={activeBarangayId ?? ALL} onValueChange={onBarangayChange}>
          <SelectTrigger size="sm" className="min-w-36">
            <SelectValue placeholder="All barangays">
              {(value) =>
                value && value !== ALL
                  ? barangayList.find((b) => b.id === value)?.name ?? "All barangays"
                  : "All barangays"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All barangays</SelectItem>
            {barangayList.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
