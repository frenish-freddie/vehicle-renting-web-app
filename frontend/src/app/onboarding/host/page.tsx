"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import {
  Upload, CheckCircle2, Clock, XCircle, AlertTriangle,
  FileImage, ArrowRight, ShieldCheck, Info, Loader2
} from "lucide-react";
import Link from "next/link";
import Tesseract from "tesseract.js";

type KycStatus = "unsubmitted" | "pending" | "approved" | "rejected";

interface UploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
}

const initialUploadState = (): UploadState => ({
  file: null, preview: null, uploading: false, uploaded: false, error: null,
});

const STATUS_CONFIG: Record<KycStatus, { icon: React.ReactNode; label: string; color: string; bg: string; border: string }> = {
  unsubmitted: {
    icon: <AlertTriangle className="h-5 w-5" />,
    label: "Action Required",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  pending: {
    icon: <Clock className="h-5 w-5" />,
    label: "Under Review",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  approved: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    label: "KYC Approved",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  rejected: {
    icon: <XCircle className="h-5 w-5" />,
    label: "KYC Rejected",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
};

function UploadZone({
  label, hint, accept, state, onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  state: UploadState;
  onChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-200">{label}</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[140px] group
          ${state.uploaded
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }}
        />

        {state.uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-2" />
            <p className="text-xs text-slate-400 font-medium">Processing...</p>
          </div>
        ) : state.uploaded ? (
          <>
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-400">Uploaded successfully</p>
            <p className="text-xs text-slate-500">{state.file?.name}</p>
          </>
        ) : (
          <>
            {state.preview ? (
              <img src={state.preview} alt="preview" className="h-20 w-auto rounded-lg object-cover opacity-80" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition">
                <FileImage className="h-6 w-6 text-slate-400" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300">Drag & drop or <span className="text-blue-400">browse</span></p>
              <p className="text-xs text-slate-500 mt-1">{hint}</p>
            </div>
          </>
        )}

        {state.error && (
          <p className="text-xs text-red-400 font-semibold mt-1">{state.error}</p>
        )}
      </div>
    </div>
  );
}

export default function HostOnboardingPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [kycStatus, setKycStatus] = useState<KycStatus>("unsubmitted");
  const [aadhaarUrl, setAadhaarUrl] = useState<string | null>(null);
  const [panUrl, setPanUrl] = useState<string | null>(null);
  const [aadhaar, setAadhaar] = useState<UploadState>(initialUploadState());
  const [pan, setPan] = useState<UploadState>(initialUploadState());
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [aadhaarDetails, setAadhaarDetails] = useState({
    name: "", dob: "", gender: "Male", number: "", address: ""
  });

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    // Fetch current KYC status
    api.get("/api/host-kyc/status")
      .then((r) => {
        setKycStatus(r.data.host_kyc_status);
        setAadhaarUrl(r.data.host_aadhaar_url);
        setPanUrl(r.data.host_pan_url);
      })
      .catch(() => { })
      .finally(() => setLoadingStatus(false));
  }, [token, router]);

  const uploadDoc = async (
    file: File,
    endpoint: string,
    setState: React.Dispatch<React.SetStateAction<UploadState>>,
    onSuccess: (url: string, newStatus: KycStatus) => void,
    extraData: Record<string, string> = {}
  ) => {
    setState((s) => ({ ...s, file, uploading: true, error: null }));
    // Show local preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setState((s) => ({ ...s, preview: e.target?.result as string }));
      reader.readAsDataURL(file);
    }
    const form = new FormData();
    form.append("file", file);
    Object.entries(extraData).forEach(([k, v]) => form.append(k, v));
    try {
      const res = await api.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setState((s) => ({ ...s, uploading: false, uploaded: true }));
      onSuccess(res.data[Object.keys(res.data).find((k) => k.includes("url"))!], res.data.host_kyc_status);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Upload failed. Please try again.";
      setState((s) => ({ ...s, uploading: false, error: msg }));
    }
  };

  const cfg = STATUS_CONFIG[kycStatus];

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20 mx-auto mb-2">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Host Verification</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Upload your Aadhaar and PAN card so our team can verify your identity.
            Your listing will go live within 24 hours of approval.
          </p>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
          <div className={cfg.color}>{cfg.icon}</div>
          <div>
            <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {kycStatus === "unsubmitted" && "Please upload both documents below to activate your host account."}
              {kycStatus === "pending" && "Your documents are under review. You'll be notified within 24 hours."}
              {kycStatus === "approved" && "Your KYC is approved! You can now list vehicles on FlexiRide."}
              {kycStatus === "rejected" && "Your KYC was rejected. Please re-upload valid documents."}
            </p>
          </div>
        </div>

        {/* Already approved */}
        {kycStatus === "approved" ? (
          <div className="text-center py-8">
            <Link
              href="/dashboard/host"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              Go to Host Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-8">
            {/* Steps indicator */}
            <div className="flex items-center gap-3">
              {[
                { num: 1, label: "Aadhaar / Govt ID", done: !!(aadhaarUrl || aadhaar.uploaded) },
                { num: 2, label: "PAN Card", done: !!(panUrl || pan.uploaded) },
                { num: 3, label: "Admin Review", done: false },
              ].map((step, i) => (
                <div key={step.num} className="flex items-center gap-2 flex-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${step.done ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400"}`}>
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                  </div>
                  <span className="text-xs font-semibold text-slate-400 hidden sm:block">{step.label}</span>
                  {i < 2 && <div className="flex-1 h-px bg-white/10 hidden sm:block" />}
                </div>
              ))}
            </div>

            {/* Aadhaar Upload Details */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-200">1. Aadhaar Card / Government ID</label>
              <p className="text-xs text-slate-400">Please provide your details exactly as they appear on your document.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  placeholder="Full Name as on Aadhaar" 
                  value={aadhaarDetails.name} 
                  onChange={e => setAadhaarDetails({...aadhaarDetails, name: e.target.value})}
                  className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm w-full" 
                />
                <input 
                  type="date" 
                  placeholder="Date of Birth" 
                  value={aadhaarDetails.dob} 
                  onChange={e => setAadhaarDetails({...aadhaarDetails, dob: e.target.value})}
                  className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm w-full" 
                />
                <select 
                  value={aadhaarDetails.gender} 
                  onChange={e => setAadhaarDetails({...aadhaarDetails, gender: e.target.value})}
                  className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm w-full text-slate-300"
                >
                  <option value="Male" className="bg-black">Male</option>
                  <option value="Female" className="bg-black">Female</option>
                  <option value="Other" className="bg-black">Other</option>
                </select>
                <input 
                  placeholder="12-Digit Aadhaar Number" 
                  value={aadhaarDetails.number} 
                  onChange={e => setAadhaarDetails({...aadhaarDetails, number: e.target.value})}
                  className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm w-full" 
                />
                <input 
                  placeholder="Full Address including PIN Code" 
                  value={aadhaarDetails.address} 
                  onChange={e => setAadhaarDetails({...aadhaarDetails, address: e.target.value})}
                  className="h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm w-full md:col-span-2" 
                />
              </div>

              <UploadZone
                label="Upload Original Aadhaar Image"
                hint="Front & back of Aadhaar, Voter ID, or Passport · JPEG, PNG, PDF · Max 8MB"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                state={aadhaar}
                onChange={async (file) => {
                  if (!aadhaarDetails.name || !aadhaarDetails.number) {
                    setAadhaar(s => ({...s, error: "Please fill out Name and Aadhaar Number first."}));
                    return;
                  }

                  if (!file.type.startsWith("application/pdf")) {
                    setAadhaar(s => ({ ...s, uploading: true, error: null })); // Reusing uploading state for the spinner during verification
                    try {
                      const result = await Tesseract.recognize(file, "eng");
                      const text = result.data.text.toLowerCase();
                      const hasKeywords = text.includes("government of india") || text.includes("aadhaar");
                      const hasPattern = /\d{4}\s?\d{4}\s?\d{4}/.test(text);

                      if (!hasKeywords && !hasPattern) {
                        setAadhaar(s => ({ ...s, uploading: false, error: "Invalid document detected. Please upload a clear image of a valid Aadhaar card.", file: null }));
                        return;
                      }
                    } catch (err) {
                      console.error("OCR Error:", err);
                      setAadhaar(s => ({ ...s, uploading: false, error: "Failed to verify image. Please try another clear photo.", file: null }));
                      return;
                    }
                  }

                  uploadDoc(file, "/api/host-kyc/upload-aadhaar", setAadhaar, (url, status) => {
                    setAadhaarUrl(url);
                    setKycStatus(status);
                  }, {
                    aadhaar_name: aadhaarDetails.name,
                    aadhaar_dob: aadhaarDetails.dob,
                    aadhaar_gender: aadhaarDetails.gender,
                    aadhaar_number: aadhaarDetails.number,
                    aadhaar_address: aadhaarDetails.address
                  })
                }}
              />
            </div>

            {/* Preview of already-uploaded Aadhaar */}
            {aadhaarUrl && !aadhaar.uploaded && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 -mt-4">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Aadhaar already uploaded. </span>
                <a href={`http://localhost:8000${aadhaarUrl}`} target="_blank" rel="noreferrer" className="underline">View</a>
              </div>
            )}

            <UploadZone
              label="2. PAN Card"
              hint="Clear photo or scanned copy of your PAN card · JPEG, PNG, PDF · Max 8MB"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              state={pan}
              onChange={(file) =>
                uploadDoc(file, "/api/host-kyc/upload-pan", setPan, (url, status) => {
                  setPanUrl(url);
                  setKycStatus(status);
                })
              }
            />

            {/* Preview of already-uploaded PAN */}
            {panUrl && !pan.uploaded && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 -mt-4">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>PAN already uploaded. </span>
                <a href={`http://localhost:8000${panUrl}`} target="_blank" rel="noreferrer" className="underline">View</a>
              </div>
            )}

            {/* Info note */}
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
              <p>Your documents are encrypted and only visible to FlexiRide admins for verification purposes. We never share them with third parties.</p>
            </div>

            {/* CTA */}
            {(kycStatus === "pending" || ((aadhaarUrl || aadhaar.uploaded) && (panUrl || pan.uploaded))) && (
              <div className="pt-2">
                <Link
                  href="/dashboard/host"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
                >
                  Continue to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-center text-xs text-slate-500 mt-3">You can still access your dashboard while your KYC is under review.</p>
              </div>
            )}
          </div>
        )}

        {/* Skip link */}
        <p className="text-center text-xs text-slate-600">
          Want to do this later?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">Sign in instead</Link>
        </p>
      </div>
    </div>
  );
}
