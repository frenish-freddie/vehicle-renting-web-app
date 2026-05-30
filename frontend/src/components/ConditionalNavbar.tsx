"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

/**
 * Renders the default Navbar on all pages except the home page,
 * which uses its own HeroNavbar component overlay.
 */
export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Home page has its own HeroNavbar — don't show the default sticky navbar
  if (pathname === "/") return null;

  return <Navbar />;
}
