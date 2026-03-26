import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Campus Connect - The Social Platform for Students",
  description: "Connect with students on your campus. Chat, discover nearby users, share stories, trade on the marketplace, and more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Campus Connect",
  },
  openGraph: {
    title: "Campus Connect",
    description: "The social platform built for university students",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-[#16161e] text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
