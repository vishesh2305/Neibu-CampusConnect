// src/app/providers.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <Toaster position="top-right" reverseOrder={false} />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}