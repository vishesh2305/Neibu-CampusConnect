"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  Navbar,
  NavBody,
  NavItems,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from "@/components/ui/resizeable-navbar";
import Sidebar from "../../components/Sidebar";
import Notifications from "@/components/Notifications";
import ThemeSwitcher from "@/components/ThemeSwitcher"; // ✅ Import ThemeSwitcher

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Groups", link: "/groups" },
    { name: "Events", link: "/events" },
    { name: "Messages", link: "/messages" },
  ];

  return (
    <>
      <Navbar>
        {/* Desktop Navbar */}
        <NavBody>
          {session?.user?.image ? (
            <Link href="/profile/edit" className="flex items-center">
              <Image
                src={session.user.image}
                alt="User avatar"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            </Link>
          ) : (
            <div className="text-xl font-bold">MyApp</div>
          )}

          <NavItems items={navItems} />
          <div className="px-5 flex items-center justify-between gap-4">
            <ThemeSwitcher /> {/* ✅ Add ThemeSwitcher here */}
            {session && <Notifications />}
            <NavbarButton onClick={() => signOut({ callbackUrl: "/" })}>
              Log Out
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navbar */}
        <MobileNav>
          <MobileNavHeader>
            {session?.user?.image ? (
              <Link href="/profile/edit" className="flex items-center">
                <Image
                  src={session.user.image}
                  alt="User avatar"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </Link>
            ) : (
              <div className="text-xl font-bold">MyApp</div>
            )}
            <MobileNavToggle
              isOpen={isOpen}
              onClick={() => setIsOpen(!isOpen)}
            />
          </MobileNavHeader>
          <MobileNavMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <NavItems
              items={navItems}
              className="flex-col items-start space-y-4"
              onItemClick={() => setIsOpen(false)}
            />
            <div className="flex flex-col items-start gap-4 mt-4">
              <div className="flex items-center gap-4">
                <ThemeSwitcher /> {/* ✅ Add ThemeSwitcher here */}
                {session && <Notifications />}
              </div>
              <NavbarButton
                onClick={() => {
                  signOut({ callbackUrl: "/" });
                  setIsOpen(false);
                }}
              >
                Log Out
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 mt-10 flex-shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 p-8 pt-28 bg-background">{children}</main> {/* ✅ theme-aware background */}
      </div>
    </>
  );
}