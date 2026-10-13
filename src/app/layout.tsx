import type { Metadata, Viewport } from "next";
import { publicEnv } from "@/lib/env/client";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Thaal — write, publish and sell in your language",
    template: "%s · Thaal",
  },
  description:
    "Write privately, publish free or paid, and keep 85% of every sale. Books, stories, poems and comics in English and Indian languages.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#151514" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
