import { SystemStatus } from "@/components/system-status";
import { OrganizationTree } from "@/components/organization-tree";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Phase 1 — Tenant, Organizations &amp; Identity
        </p>
      </div>

      <SystemStatus />
      <OrganizationTree />
    </div>
  );
}
