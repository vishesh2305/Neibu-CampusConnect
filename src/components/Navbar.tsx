// src/components/Navbar.tsx

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Notifications from "./Notifications";
import SearchBar from "./SearchBar"; // Import the new component

export default function Navbar() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-16"></div>;
  }

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-blue-500"
        >
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </svg>
        <span className="ml-2 text-lg font-bold">CampusConnect</span>
      </Link>

      {/* Search Bar */}
      {session && <SearchBar />}

      {/* Navigation + User Actions */}
      <nav className="flex items-center gap-4 sm:gap-6">
        {session && (
          <>
            <Notifications />
            <Link
              href="/profile/edit"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Log Out
            </button>
            <Link href="/profile/edit">
              <Image
                src={session.user?.image || "/default-avatar.png"}
                alt="User avatar"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
