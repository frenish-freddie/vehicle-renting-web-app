"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

/**
 * Legacy /dashboard/admin stub — redirects immediately to the new
 * isolated admin console at /admin-dashboard.
 * Admin users now land here only if they have a very old cached token;
 * the login page already redirects them to /admin-dashboard directly.
 */
export default function AdminDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin-dashboard");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="h-12 w-12 rounded-2xl bg-amber-400/10 flex items-center justify-center">
        <Shield className="h-6 w-6 text-amber-500" />
      </div>
      <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
      <p className="text-xs text-neutral-500 font-semibold">
        Redirecting to Admin Console…
      </p>
    </div>
  );
}
