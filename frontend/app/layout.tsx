import type { Metadata } from "next";
import "./globals.css";
import { PermissionProvider } from "../contexts/PermissionContext";

export const metadata: Metadata = {
  title: {
    default: "CapSyncer - Team Capacity Management",
    template: "%s | CapSyncer",
  },
  description:
    "Modern team capacity management system for tracking projects, tasks, and team member assignments. Optimize your team's workload and boost productivity.",
  keywords: [
    "capacity management",
    "team management",
    "project management",
    "task tracking",
    "resource planning",
    "workload management",
    "team productivity",
    "assignment tracking",
  ],
  authors: [{ name: "CapSyncer Team" }],
  creator: "CapSyncer",
  publisher: "CapSyncer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "CapSyncer - Team Capacity Management",
    description:
      "Modern team capacity management system for tracking projects, tasks, and team member assignments.",
    siteName: "CapSyncer",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CapSyncer - Team Capacity Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CapSyncer - Team Capacity Management",
    description:
      "Modern team capacity management system for tracking projects, tasks, and team member assignments.",
    images: ["/og-image.png"],
    creator: "@capsyncer",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="/" />
      </head>
      <body className="antialiased">
        <PermissionProvider>{children}</PermissionProvider>
      </body>
    </html>
  );
}
