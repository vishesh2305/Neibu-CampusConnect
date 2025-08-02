import type { Metadata } from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import Providers from "./providers";
const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "CampusConnect - The Social Platform for Students",
  description: "A modern social media platform exclusively for university students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
