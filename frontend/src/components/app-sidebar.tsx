"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
  SettingsIcon,
  LifeBuoyIcon,
  LandmarkIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// UGNAY navigation (spec §98). Overview is live; other sections are placeholders
// wired to "#" until their phases land.
const navMain = [
  {
    title: "Overview",
    url: "/",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "People",
    url: "#",
    icon: <UsersIcon />,
    items: [
      { title: "Residents", url: "/residents" },
      { title: "Households", url: "/households" },
      { title: "Officials", url: "/officials" },
      { title: "Puroks", url: "#" },
    ],
  },
  {
    title: "Services",
    url: "#",
    icon: <FileTextIcon />,
    items: [
      { title: "Requests", url: "/requests" },
      { title: "Certificates", url: "#" },
      { title: "Concerns", url: "#" },
    ],
  },
  {
    title: "Social Services",
    url: "#",
    icon: <HeartHandshakeIcon />,
    items: [
      { title: "Programs", url: "#" },
      { title: "Beneficiaries", url: "#" },
    ],
  },
  {
    title: "Administration",
    url: "#",
    icon: <ShieldCheckIcon />,
    items: [
      { title: "Organizations", url: "#" },
      { title: "Users", url: "#" },
      { title: "Roles & Permissions", url: "#" },
      { title: "Audit Logs", url: "/audit" },
    ],
  },
];

const navSecondary = [
  { title: "Settings", url: "#", icon: <SettingsIcon /> },
  { title: "Get Help", url: "#", icon: <LifeBuoyIcon /> },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const mainItems = navMain.map((item) => ({
    ...item,
    isActive:
      item.url === "/"
        ? pathname === "/"
        : item.items?.some(
            (sub) =>
              sub.url !== "#" &&
              (pathname === sub.url || pathname.startsWith(sub.url + "/")),
          ),
  }));

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LandmarkIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">UGNAY</span>
                <span className="truncate text-xs text-muted-foreground">
                  LGU Platform
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
