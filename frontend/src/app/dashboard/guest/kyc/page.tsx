"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function UserKycUploadPage() {
  const router = useRouter();
  const [dlFile, setDlFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const renderPreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="h-full w-full object-cover rounded-xl"
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-emerald-600">
        <CheckCircle2 className="h-8 w-8 mb-2" />
        <span className="text-xs font-bold px-2 text-center break-all">{file.name}</span>
      </div>
    );
  };

  const handleUpload = async () => {
    if (!dlFile && !aadhaarFile) {
      setError("Please select at least one document to upload.");
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      if (dlFile) {
        const formData = new FormData();
        formData.append("file", dlFile);
        await api.post("/api/user-kyc/upload-dl", formData);
      }

      if (aadhaarFile) {
        const formData = new FormData();
        formData.append("file", aadhaarFile);
        await api.post("/api/user-kyc/upload-aadhaar", formData);
      }

      setSuccess("Documents uploaded successfully! Waiting for admin approval.");
      setTimeout(() => router.push("/dashboard/guest"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Verify Your Identity</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Please upload your Driving License and Aadhaar documents to verify your identity.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
        {/* Driving License Upload */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-neutral-900 dark:text-white">Driving License</label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setDlFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
                <div className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center text-center transition relative overflow-hidden ${
                dlFile ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 p-1" : "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-6"
              }`}>
                {dlFile ? (
                  renderPreview(dlFile)
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-neutral-400 mb-2" />
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Click to upload DL</p>
                    <p className="text-xs text-neutral-500 mt-1">JPEG, PNG, WebP or PDF (Max 8MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Aadhaar Upload */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-neutral-900 dark:text-white">Aadhaar / Government ID</label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center text-center transition relative overflow-hidden ${
                aadhaarFile ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 p-1" : "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-6"
              }`}>
                {aadhaarFile ? (
                  renderPreview(aadhaarFile)
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-neutral-400 mb-2" />
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Click to upload Aadhaar</p>
                    <p className="text-xs text-neutral-500 mt-1">JPEG, PNG, WebP or PDF (Max 8MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={isUploading || (!dlFile && !aadhaarFile)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            "Confirm Documents and Submit"
          )}
        </button>
      </div>
    </div>
  );
}
