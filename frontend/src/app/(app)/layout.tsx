"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/lib/use-auth";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/residents": "Residents",
  "/households": "Households",
  "/officials": "Officials",
  "/requests": "Requests",
  "/audit": "Audit Logs",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Section prefixes for nested/detail routes (e.g. /residents/{id}).
  const section = Object.keys(PAGE_TITLES).find(
    (p) => p !== "/" && pathname.startsWith(p + "/"),
  );
  return section ? PAGE_TITLES[section] : "UGNAY";
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  useEffect(() => {
    if (!me.isPending && !me.data) {
      router.replace("/login");
    }
  }, [me.isPending, me.data, router]);

  // While resolving the session (or redirecting), show a lightweight placeholder.
  if (me.isPending || !me.data) {
    return (
      <div className="flex min-h-svh items-center justify-center p-8">
        <Skeleton className="h-40 w-full max-w-md" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
