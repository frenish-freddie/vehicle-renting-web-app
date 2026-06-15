import "@/styles/globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import ConditionalShell from "@/components/ConditionalShell";

export const metadata: Metadata = {
  title: "FlexiRide — Universal Vehicle Rentals",
  description:
    "Every vehicle. Anywhere. Anytime. Rent cars, bikes, trucks, and heavy machinery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased bg-surface text-text-primary">
        {/* Conditionally show default Navbar (hidden on / and /admin-dashboard) */}
        <ConditionalNavbar />

        {/* Dynamic Pages */}
        <main className="flex-1">{children}</main>

        {/* Footer + FloatingChat — hidden on /admin-dashboard isolated layout */}
        <ConditionalShell />
      </body>
    </html>
  );
}
