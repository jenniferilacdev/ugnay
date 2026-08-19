"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrganizationTree, type OrganizationNode } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function OrgNode({ node, depth }: { node: OrganizationNode; depth: number }) {
  return (
    <li>
      <div
        className="flex items-center gap-2 py-1.5"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <Badge variant="outline" className="text-[10px] uppercase">
          {node.type}
        </Badge>
        <span className="font-medium">{node.name}</span>
        <span className="font-mono text-xs text-muted-foreground">/{node.slug}</span>
        {node.puroks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            · {node.puroks.length} purok{node.puroks.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrganizationTree() {
  const query = useQuery({
    queryKey: ["organizations", "tree"],
    queryFn: ({ signal }) => getOrganizationTree(signal),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization hierarchy</CardTitle>
        <CardDescription>
          Organizations within your tenant and scope.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {query.isPending && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {query.isError && (
          <p className="text-sm text-destructive">Could not load organizations.</p>
        )}
        {query.data && (
          <ul>
            {query.data.map((node) => (
              <OrgNode key={node.id} node={node} depth={0} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
