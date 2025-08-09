"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  IconLayoutDashboard,
  IconUsers,
  IconCalendarEvent,
  IconMessage,
  IconSearch,
  IconUser,
  IconSettings,
  IconLogout,
  IconMenu2,
  IconBell,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { FloatingDock } from "@/components/ui/floating-dock";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Sidebar navigation items
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconLayoutDashboard className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    },
    {
      label: "Groups",
      href: "/groups",
      icon: <IconUsers className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />,
    },
    {
      label: "Events",
      href: "/events",
      icon: (
        <IconCalendarEvent className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    },
    {
      label: "Messages",
      href: "/messages",
      icon: <IconMessage className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />,
    },
    {
      label: "Search",
      href: "/search",
      icon: <IconSearch className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />,
    },
  ];

  if (session?.user?.role === "admin") {
    navItems.push({
      label: "Admin",
      href: "/admin",
      icon: <IconSettings className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />,
    });
  }

  // Prepare dock items for FloatingDock
  const dockItems = [
    {
      title: "Menu",
      icon: <IconMenu2 className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
      onClick: () => setSidebarOpen(!isSidebarOpen),
      href: "#",
    },
    {
      title: "Groups",
      icon: <IconUsers className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
      href: "/groups",
    },
    {
      title: "Messages",
      icon: <IconMessage className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
      href: "/messages",
    },
    {
      title: "Search",
      icon: <IconSearch className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
      href: "/search",
    },
    {
      title:"Notifications",
      icon: <IconBell className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />,
      href:"/notifications",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar open={isSidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col">
            <div className="mt-8 flex flex-col gap-2">
              {navItems.map((item, idx) => (
                <SidebarLink key={idx} link={item} />
              ))}
            </div>
          </div>
          <div>
            {session?.user && (
              <SidebarLink
                link={{
                  label: "Profile",
                  href: `/profile/${session.user.id}`,
                  icon: (
                    <IconUser className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                  ),
                }}
              />
            )}
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: (
                  <IconLogout className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                ),
              }}
              onClick={() => signOut()}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
          <FloatingDock items={dockItems} />
        </div>
      </div>
    </div>
  );
}