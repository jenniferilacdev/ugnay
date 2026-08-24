"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getOrganizationTree, type OrganizationNode } from "@/lib/api";
import { useActingScope } from "@/lib/scope-context";

export type BarangayOption = { id: string; name: string };

function flattenBarangays(nodes: OrganizationNode[]): BarangayOption[] {
  const out: BarangayOption[] = [];
  const walk = (list: OrganizationNode[]) => {
    for (const node of list) {
      if (node.type === "Barangay") out.push({ id: node.id, name: node.name });
      if (node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/** The city/municipality that the acting scope resolves to (itself, or the parent of the acting barangay). */
function findMunicipality(
  nodes: OrganizationNode[],
  actingOrgId: string | null,
): OrganizationNode | null {
  if (!actingOrgId) return null;
  let found: OrganizationNode | null = null;
  const walk = (list: OrganizationNode[]) => {
    for (const node of list) {
      const isMunicipality = node.type === "City" || node.type === "Municipality";
      if (
        isMunicipality &&
        (node.id === actingOrgId ||
          node.children.some((c) => c.type === "Barangay" && c.id === actingOrgId))
      ) {
        found = node;
      }
      if (node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return found;
}

/**
 * Barangays to offer for the current acting scope: the barangays under the
 * municipality selected in the header, or every barangay in the account's scope
 * when no municipality is focused. Sorted by name.
 */
export function useScopedBarangays() {
  const { actingOrgId } = useActingScope();
  const tree = useQuery({
    queryKey: ["organization-tree"],
    queryFn: ({ signal }) => getOrganizationTree(signal),
    staleTime: 5 * 60 * 1000,
  });

  const barangays = useMemo<BarangayOption[]>(() => {
    const nodes = tree.data ?? [];
    const municipality = findMunicipality(nodes, actingOrgId);
    const list = municipality
      ? municipality.children
          .filter((c) => c.type === "Barangay")
          .map((c) => ({ id: c.id, name: c.name }))
      : flattenBarangays(nodes);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [tree.data, actingOrgId]);

  return { barangays, isPending: tree.isPending };
}
