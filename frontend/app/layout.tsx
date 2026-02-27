import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CapSyncer - Team Capacity Management",
  description: "Modern team capacity management system built with .NET Aspire and Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
