"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

/**
 * Renders the default Navbar on all pages except:
 * - The home page (uses its own HeroNavbar component overlay)
 * - The /admin-dashboard route group (has its own full-screen admin layout)
 */
export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Home page has its own HeroNavbar
  if (pathname === "/") return null;

  // Admin dashboard has a fully isolated layout with its own sidebar + topbar
  if (pathname.startsWith("/admin-dashboard")) return null;

  return <Navbar />;
}
