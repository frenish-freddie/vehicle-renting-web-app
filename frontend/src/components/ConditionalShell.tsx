"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import FloatingChat from "@/components/FloatingChat";

/**
 * ConditionalShell renders the global Footer and FloatingChat
 * on all pages EXCEPT the /admin-dashboard route group,
 * which has its own fully isolated layout.
 */
export default function ConditionalShell() {
  const pathname = usePathname();

  // Admin dashboard manages its own full-screen layout — suppress global chrome
  if (pathname.startsWith("/admin-dashboard")) return null;

  return (
    <>
      <FloatingChat />
      <Footer />
    </>
  );
}
