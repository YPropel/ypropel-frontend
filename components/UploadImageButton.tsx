// components/UploadImageButton.tsx
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    cloudinary: any;
  }
}

type Props = {
  cloudName: string;           // e.g. "denggbgma"
  uploadPreset: string;        // e.g. "unsigned_ypropel_shop"
  folder?: string;             // e.g. "ypropel-shop"
  buttonText?: string;
  onUploaded: (secureUrl: string, publicId: string) => void;
};

export default function UploadImageButton({
  cloudName,
  uploadPreset,
  folder = "ypropel-shop",
  buttonText = "Upload image",
  onUploaded,
}: Props) {
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Only init once, and only when script loaded
    if (typeof window === "undefined") return;
    if (!window.cloudinary) return;          // script not ready yet
    if (widgetRef.current) return;           // already initialized

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        multiple: false,
        sources: ["local", "url", "camera"],
        cropping: false,
        folder,
        maxFileSize: 10_000_000, // 10MB
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const { secure_url, public_id } = result.info;
          onUploaded(secure_url, public_id);
        }
      }
    );
  }, [cloudName, uploadPreset, folder]);

  const openWidget = () => {
    if (widgetRef.current) widgetRef.current.open();
  };

  return (
    <>
      {/* Load the Cloudinary widget script once per page load */}
      <Script
        src="https://widget.cloudinary.com/v2.0/global/all.js"
        strategy="afterInteractive"
        onLoad={() => {
          // If the component mounted before the script loaded, this allows the effect above to run next render
          // No-op here; the effect’s guards will handle re-init.
        }}
      />
      <button
        type="button"                   // IMPORTANT: no accidental form submit
        onClick={openWidget}            // Must be invoked by a user click
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {buttonText}
      </button>
    </>
  );
}
