/* components/UploadImageButton.tsx */
/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  cloudName: string;              // e.g. "denggbgma"
  uploadPreset: string;           // e.g. "unsigned_ypropel_shop" (MUST be unsigned)
  folder?: string;                // e.g. "ypropel-shop"
  buttonText?: string;
  onUploaded: (secureUrl: string, publicId: string) => void;
};

declare global {
  interface Window {
    cloudinary?: any;
  }
}

const CLOUDINARY_WIDGET_SRC = "https://widget.cloudinary.com/v2.0/global/all.js";

export default function UploadImageButton({
  cloudName,
  uploadPreset,
  folder,
  buttonText = "Upload image",
  onUploaded,
}: Props) {
  const [scriptReady, setScriptReady] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [widgetFailed, setWidgetFailed] = useState(false);
  const widgetRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load script once (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.cloudinary) {
      setScriptReady(true);
      return;
    }
    const existing = document.querySelector(`script[src="${CLOUDINARY_WIDGET_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any)._loaded) {
        setScriptReady(true);
      } else {
        existing.addEventListener("load", () => setScriptReady(true));
        existing.addEventListener("error", () => setWidgetFailed(true));
      }
      return;
    }
    const s = document.createElement("script");
    s.src = CLOUDINARY_WIDGET_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      (s as any)._loaded = true;
      setScriptReady(true);
    };
    s.onerror = () => setWidgetFailed(true);
    document.body.appendChild(s);
  }, []);

  const ensureWidget = useCallback(() => {
    if (!scriptReady || !window.cloudinary) return false;
    if (widgetRef.current) return true;

    try {
      setInitializing(true);
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          folder,
          sources: ["local", "url", "camera"],
          multiple: false,
          maxFileSize: 15_000_000, // 15MB
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          cropping: false,
          showCompletedButton: true,
          showUploadMoreButton: false,
        },
        (error: any, result: any) => {
          if (error) {
            console.error("Cloudinary widget error:", error);
            return;
          }
          if (result?.event === "success") {
            const secureUrl = result.info?.secure_url;
            const publicId = result.info?.public_id;
            if (secureUrl && publicId) onUploaded(secureUrl, publicId);
          }
        }
      );
      setInitializing(false);
      return true;
    } catch (e) {
      console.error("Failed to create Cloudinary widget:", e);
      setInitializing(false);
      setWidgetFailed(true);
      return false;
    }
  }, [scriptReady, cloudName, uploadPreset, folder, onUploaded]);

  const handleClick = () => {
    // Try widget first
    if (ensureWidget() && widgetRef.current) {
      try {
        widgetRef.current.open();
        return;
      } catch (e) {
        console.error("Widget open failed:", e);
        setWidgetFailed(true);
      }
    }
    // Fallback to direct unsigned upload input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Fallback: direct unsigned upload via REST
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", uploadPreset);
      if (folder) form.append("folder", folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      if (data.secure_url && data.public_id) {
        onUploaded(data.secure_url, data.public_id);
      } else {
        throw new Error("Upload succeeded but missing secure_url/public_id.");
      }
    } catch (err: any) {
      alert(err?.message || "Direct upload failed.");
    } finally {
      // reset input so same file can be picked again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={initializing}
        className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        title={
          widgetFailed
            ? "Widget failed to load. Using fallback uploader."
            : "Upload an image"
        }
      >
        {initializing ? "Preparing…" : buttonText}
      </button>

      {/* Hidden fallback input for direct unsigned upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {widgetFailed && (
        <span className="text-xs text-amber-700">
          Widget unavailable — using fallback uploader.
        </span>
      )}
    </div>
  );
}
