import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  Verified: "bg-emerald-600 text-white hover:bg-emerald-600",
  Rejected: "bg-red-600 text-white hover:bg-red-600",
  Suspended: "bg-amber-500 text-white hover:bg-amber-500",
};

export function VerificationBadge({ status }: { status: string }) {
  const custom = STYLES[status];
  return (
    <Badge variant={custom ? "default" : "secondary"} className={cn(custom)}>
      {status}
    </Badge>
  );
}
