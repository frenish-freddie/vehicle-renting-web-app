"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/services/api";
import { ShieldAlert, ShieldCheck, Upload, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function UserKycBanner() {
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/api/user-kyc/status");
      setKycStatus(res.data.user_kyc_status);
    } catch (e) {
      console.error("Failed to load user KYC status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) return null;

  if (kycStatus === "approved") {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Account Verified</h3>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Your identity documents have been verified.</p>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus === "pending") {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400">Verification Pending</h3>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Your documents are under review by the admin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-700 dark:text-blue-400">Verify Your Identity</h3>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 max-w-sm">
              {kycStatus === "rejected" 
                ? "Your previous documents were rejected. Please upload your Driving License and Aadhaar to verify your identity and rent vehicles."
                : "Upload your Driving License and Aadhaar to verify your identity and rent vehicles seamlessly."}
            </p>
          </div>
        </div>
        <Link 
          href="/dashboard/guest/kyc"
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2"
        >
          Upload Documents <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
