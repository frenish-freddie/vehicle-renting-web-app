"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";

export default function UserKycUploadPage() {
  const router = useRouter();
  const [dlFile, setDlFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarDetails, setAadhaarDetails] = useState({
    name: "", dob: "", gender: "Male", number: "", address: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifyingDl, setIsVerifyingDl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAadhaarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAadhaarFile(null);
      return;
    }

    if (file.type === "application/pdf") {
      // Skip OCR for PDFs (tesseract.js handles images best)
      setAadhaarFile(file);
      setError(null);
      return;
    }

    setIsVerifying(true);
    setError(null);
    setAadhaarFile(null); // Clear previous if any

    try {
      const result = await Tesseract.recognize(file, "eng");
      const text = result.data.text.toLowerCase();
      
      // Look for keywords or 12 digit pattern (xxxx xxxx xxxx or xxxxxxxxxxxx)
      const hasKeywords = text.includes("government of india") || text.includes("aadhaar");
      const hasPattern = /\d{4}\s?\d{4}\s?\d{4}/.test(text);

      if (!hasKeywords && !hasPattern) {
        setError("Invalid document detected. Please ensure you are uploading a clear image of a valid Aadhaar card.");
        return; // File remains null
      }

      setAadhaarFile(file);
    } catch (err) {
      console.error("OCR Error:", err);
      // Fallback: If OCR completely fails, we might still let it pass, but typically we want to reject or warn.
      setError("Failed to verify Aadhaar image. Please try another clear photo.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDlSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setDlFile(null);
      return;
    }

    if (file.type === "application/pdf") {
      setDlFile(file);
      setError(null);
      return;
    }

    setIsVerifyingDl(true);
    setError(null);
    setDlFile(null); 

    try {
      const result = await Tesseract.recognize(file, "eng");
      const text = result.data.text.toLowerCase();
      
      const hasKeywords = text.includes("driving licence") || text.includes("driving license") || text.includes("dl no") || text.includes("transport department");

      if (!hasKeywords) {
        setError("Invalid document detected. Please ensure you are uploading a clear image of a valid Driving License.");
        return; 
      }

      setDlFile(file);
    } catch (err) {
      console.error("OCR Error:", err);
      setError("Failed to verify DL image. Please try another clear photo.");
    } finally {
      setIsVerifyingDl(false);
    }
  };

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
        formData.append("aadhaar_name", aadhaarDetails.name);
        formData.append("aadhaar_dob", aadhaarDetails.dob);
        formData.append("aadhaar_gender", aadhaarDetails.gender);
        formData.append("aadhaar_number", aadhaarDetails.number);
        formData.append("aadhaar_address", aadhaarDetails.address);
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
                onChange={handleDlSelect}
                disabled={isVerifyingDl}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
              />
              <div className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center text-center transition relative overflow-hidden ${dlFile ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 p-1" : "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-6"
                }`}>
                {isVerifyingDl ? (
                  <div className="flex flex-col items-center justify-center h-full text-emerald-600">
                    <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                    <span className="text-xs font-bold px-2 text-center">Verifying DL...</span>
                  </div>
                ) : dlFile ? (
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

        {/* Aadhaar Upload & Details */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white">Aadhaar / Government ID</label>
            <p className="text-xs text-neutral-500 mt-1">Please provide your original Aadhaar details and upload a photo of the card.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Full Name as on Aadhaar" 
              value={aadhaarDetails.name} 
              onChange={e => setAadhaarDetails({...aadhaarDetails, name: e.target.value})}
              className="h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" 
            />
            <input 
              type="date" 
              placeholder="Date of Birth" 
              value={aadhaarDetails.dob} 
              onChange={e => setAadhaarDetails({...aadhaarDetails, dob: e.target.value})}
              className="h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" 
            />
            <select 
              value={aadhaarDetails.gender} 
              onChange={e => setAadhaarDetails({...aadhaarDetails, gender: e.target.value})}
              className="h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input 
              placeholder="12-Digit Aadhaar Number" 
              value={aadhaarDetails.number} 
              onChange={e => setAadhaarDetails({...aadhaarDetails, number: e.target.value})}
              className="h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" 
            />
            <input 
              placeholder="Full Address including PIN Code" 
              value={aadhaarDetails.address} 
              onChange={e => setAadhaarDetails({...aadhaarDetails, address: e.target.value})}
              className="h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm md:col-span-2" 
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleAadhaarSelect}
                disabled={isVerifying}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
              />
              <div className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center text-center transition relative overflow-hidden ${aadhaarFile ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5 p-1" : "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-6"
                }`}>
                {isVerifying ? (
                  <div className="flex flex-col items-center justify-center h-full text-emerald-600">
                    <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                    <span className="text-xs font-bold px-2 text-center">Verifying document...</span>
                  </div>
                ) : aadhaarFile ? (
                  renderPreview(aadhaarFile)
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-neutral-400 mb-2" />
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Click to upload Original Aadhaar</p>
                    <p className="text-xs text-neutral-500 mt-1">Front & Back (JPEG, PNG, WebP or PDF)</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={isUploading || isVerifying || isVerifyingDl || (!dlFile && !aadhaarFile) || !!(aadhaarFile && (!aadhaarDetails.name || !aadhaarDetails.number))}
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
