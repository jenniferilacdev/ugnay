import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  Approved: "bg-emerald-600 text-white hover:bg-emerald-600",
  Completed: "bg-emerald-700 text-white hover:bg-emerald-700",
  Processing: "bg-blue-600 text-white hover:bg-blue-600",
  UnderReview: "bg-amber-500 text-white hover:bg-amber-500",
  Rejected: "bg-red-600 text-white hover:bg-red-600",
  Cancelled: "bg-muted-foreground/70 text-white hover:bg-muted-foreground/70",
};

export function RequestStatusBadge({ status }: { status: string }) {
  const custom = STYLES[status];
  return (
    <Badge variant={custom ? "default" : "secondary"} className={cn(custom)}>
      {status}
    </Badge>
  );
}
