"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import {
  Upload, CheckCircle2, Clock, XCircle, AlertTriangle,
  FileImage, ArrowRight, Car, Info, Loader2, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import Tesseract from "tesseract.js";

type VerifStatus = "unsubmitted" | "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<VerifStatus, { icon: React.ReactNode; label: string; color: string; bg: string; border: string }> = {
  unsubmitted: {
    icon: <AlertTriangle className="h-5 w-5" />,
    label: "License Required",
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
    label: "License Approved",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  rejected: {
    icon: <XCircle className="h-5 w-5" />,
    label: "License Rejected",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
};

export default function DriverOnboardingPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [verifStatus, setVerifStatus] = useState<VerifStatus>("unsubmitted");
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    api.get("/api/drivers/me")
      .then((r) => {
        setVerifStatus(r.data.verification_status || "unsubmitted");
        setLicenseUrl(r.data.license_url);
      })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, [token, router]);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("application/pdf")) {
      setIsVerifying(true);
      setUploadError(null);
      setFile(null);
      setPreview(null);
      try {
        const result = await Tesseract.recognize(selectedFile, "eng");
        const text = result.data.text.toLowerCase();
        const hasKeywords = text.includes("driving licence") || text.includes("driving license") || text.includes("dl no") || text.includes("transport department") || text.includes("union of india");

        if (!hasKeywords) {
          setUploadError("Invalid document detected. Please upload a clear image of a valid Driving License.");
          setIsVerifying(false);
          return;
        }
      } catch (err) {
        console.error("OCR Error:", err);
        setUploadError("Failed to verify image. Please try another clear photo.");
        setIsVerifying(false);
        return;
      }
      setIsVerifying(false);
    }

    setFile(selectedFile);
    setUploadError(null);
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post("/api/drivers/upload-license", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVerifStatus(res.data.verification_status);
      setLicenseUrl(res.data.license_url);
      setUploaded(true);
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const cfg = STATUS_CONFIG[verifStatus];

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white py-12 px-4">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-xl shadow-violet-500/20 mx-auto mb-2">
            <Car className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Driver Verification</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Upload a clear photo of your valid driving license to start accepting trips.
            Our team reviews all submissions within 24 hours.
          </p>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
          <div className={cfg.color}>{cfg.icon}</div>
          <div>
            <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {verifStatus === "unsubmitted" && "Please upload your driving license to activate your driver account."}
              {verifStatus === "pending" && "Your license is under review. You'll be notified within 24 hours."}
              {verifStatus === "approved" && "You're verified! You can now accept trip assignments on FlexiRide."}
              {verifStatus === "rejected" && "Your license was rejected. Please re-upload a clear, valid document."}
            </p>
          </div>
        </div>

        {/* Already approved */}
        {verifStatus === "approved" ? (
          <div className="text-center py-8">
            <Link
              href="/dashboard/driver"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              Go to Driver Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-6">
            {/* Steps */}
            <div className="flex items-center gap-3">
              {[
                { num: 1, label: "Upload License", done: !!(licenseUrl || uploaded) },
                { num: 2, label: "Admin Review", done: false },
                { num: 3, label: "Start Earning", done: false },
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

            {/* Upload Zone */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-200">Driving License</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[160px] group
                  ${uploaded ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"}`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />

                {isVerifying ? (
                  <>
                    <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
                    <p className="text-sm font-semibold text-violet-400">Verifying document...</p>
                  </>
                ) : uploaded ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-400">License uploaded successfully!</p>
                  </>
                ) : preview ? (
                  <>
                    <img src={preview} alt="license preview" className="h-28 w-auto rounded-lg object-cover shadow-lg" />
                    <p className="text-xs text-slate-400">{file?.name}</p>
                  </>
                ) : licenseUrl ? (
                  <>
                    <ShieldCheck className="h-10 w-10 text-blue-400" />
                    <p className="text-sm font-semibold text-blue-400">License already on file</p>
                    <a
                      href={`http://localhost:8000${licenseUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs underline text-blue-400 hover:text-blue-300"
                    >
                      View uploaded document
                    </a>
                    <p className="text-xs text-slate-500 mt-1">Click to upload a new version</p>
                  </>
                ) : (
                  <>
                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition">
                      <FileImage className="h-7 w-7 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-300">Drag & drop or <span className="text-violet-400">browse files</span></p>
                      <p className="text-xs text-slate-500 mt-1">Front & back photo of your license · JPEG, PNG, PDF · Max 5MB</p>
                    </div>
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-red-400 font-semibold">{uploadError}</p>
              )}
            </div>

            {/* Upload button */}
            {file && !uploaded && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-violet-500/20"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Submit License</>
                )}
              </button>
            )}

            {/* Info note */}
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-600" />
              <p>Documents are securely stored and only reviewed by FlexiRide verification staff. Your license details are never shared publicly.</p>
            </div>

            {/* Dashboard CTA after upload */}
            {(verifStatus === "pending" || uploaded) && (
              <Link
                href="/dashboard/driver"
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 rounded-xl transition"
              >
                Continue to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        <p className="text-center text-xs text-slate-600">
          Want to sign in?{" "}
          <Link href="/login" className="text-violet-400 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}
