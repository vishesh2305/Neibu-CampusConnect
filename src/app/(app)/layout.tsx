// src/app/(app)/layout.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useUserStore } from "@/store/userStore";
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
  IconWorld,
  IconBook,
  IconRadar2,
  IconShoppingBag,
  IconZoomQuestion,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { FloatingDock } from "@/components/ui/floating-dock";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import IncomingCallHandler from "@/components/IncomingCall";
import Onboarding from "@/components/Onboarding";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { setSession, setSocket } = useUserStore();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const socketRef = React.useRef<Socket | null>(null);

  useKeyboardShortcuts();

  // Sync session to store
  useEffect(() => {
    if (session) setSession(session);
  }, [session, setSession]);

  // Fetch initial notification count
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/notifications/count")
      .then((res) => res.json())
      .then((data) => setNotificationCount(data.count))
      .catch(() => {});
  }, [session?.user?.id]);

  // Socket connection — runs ONCE per user session, never reconnects on state changes
  useEffect(() => {
    if (!session?.user?.id) return;

    // Don't reconnect if already connected for this user
    if (socketRef.current?.connected) return;

    const newSocket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      }
    );

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("register-user", session.user.id);
    });

    newSocket.on("receive-notification", (notification) => {
      toast.success(`New notification: ${notification.type}`);
      setNotificationCount((prev) => prev + 1);
    });

    newSocket.on("reconnect", () => {
      console.log("Socket reconnected");
      newSocket.emit("register-user", session.user.id);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

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
      icon: (
        <IconUsers className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
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
      icon: (
        <IconMessage className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    },
    {
      label: "Nearby",
      href: "/nearby",
      icon: (
        <IconRadar2 className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    },
    {
      label: "Marketplace",
      href: "/marketplace",
      icon: (
        <IconShoppingBag className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    },
    {
      label: "Lost & Found",
      href: "/lost-found",
      icon: (
        <IconZoomQuestion className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    },
    {
      label: "Search",
      href: "/search",
      icon: (
        <IconSearch className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    },
    {
      label: "Global Chat",
      href: "/global-chat",
      icon: (
        <IconWorld className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    },
    {
      label: "Academic",
      href: "/academic",
      icon: (
        <IconBook className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    },
  ];

  if (session?.user?.role === "admin") {
    navItems.push({
      label: "Admin",
      href: "/admin",
      icon: (
        <IconSettings className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      ),
    });
  }

  const dockItems = [
    {
      title: "Menu",
      icon: (
        <IconMenu2 className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      ),
      onClick: () => setSidebarOpen(!isSidebarOpen),
      href: "#",
    },
    {
      title: "Groups",
      icon: (
        <IconUsers className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      ),
      href: "/groups",
    },
    {
      title: "Messages",
      icon: (
        <IconMessage className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      ),
      href: "/messages",
    },
    {
      title: "Nearby",
      icon: (
        <IconRadar2 className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      ),
      href: "/nearby",
    },
    {
      title: "Notifications",
      icon: (
        <div className="relative">
          <IconBell className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {notificationCount}
            </span>
          )}
        </div>
      ),
      href: "/notifications",
    },
    {
      title: "Marketplace",
      icon: (
        <IconShoppingBag className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      ),
      href: "/marketplace",
    },
    {
      title: "Search",
      icon: (
        <IconSearch className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      ),
      href: "/search",
    },
    {
      title: "Global Chat",
      icon: (
        <IconWorld className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      ),
      href: "/global-chat",
    },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900">
      {/* Global overlays */}
      <IncomingCallHandler />
      <Onboarding />

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
              onClick={() => signOut({ callbackUrl: "/" })}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      <div
        style={{ backgroundColor: "#16161e" }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <main className="flex-1 overflow-x-hidden overflow-y-auto ">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden md:block">
          <FloatingDock items={dockItems} />
        </div>
      </div>
    </div>
  );
}
