/* pages/admin/shop.tsx */
/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import dynamic from "next/dynamic";

// IMPORTANT: no-SSR so the Cloudinary widget is only touched client-side
const UploadImageButton = dynamic(
  () => import("../../components/UploadImageButton"),
  { ssr: false }
);

export default function AdminShop() {
  // Frontend env (unsigned upload only)
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || "";
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET || ""; // must be unsigned
  const FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "ypropel-shop";

  // Backend base URL (Render env var recommended)
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // Form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [publicId, setPublicId] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const canUpload = CLOUD_NAME && UPLOAD_PRESET;

  const handleUploaded = (secureUrl: string, pid: string) => {
    setImageUrl(secureUrl);
    setPublicId(pid);
    setMsg("✅ Image uploaded.");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg("");

      if (!title || !price || !linkUrl || !imageUrl) {
        setMsg("Please fill in Title, Price, Link URL, and upload an image.");
        return;
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setMsg("You must be logged in as an admin.");
        return;
      }

      // For now, we default to the 'dorm-essentials' category
      const payload = {
        category_slug: "dorm-essentials",
        title,
        price_text: price,
        image_url: imageUrl,
        affiliate_url: linkUrl,
      };

      const res = await fetch(`${API_BASE}/admin/shop/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create product");
      }

      const data = await res.json(); // { success: true, id }
      setMsg(`✅ Saved! Product ID: ${data.id}`);

      // Clear form
      setTitle("");
      setPrice("");
      setLinkUrl("");
      setImageUrl("");
      setPublicId("");
    } catch (e: any) {
      setMsg(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-blue-900">Admin: Shop (Dorm Stuff)</h1>

      {!canUpload && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-900 text-sm">
          Set <code>NEXT_PUBLIC_CLOUDINARY_CLOUD</code> and{" "}
          <code>NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET</code> in your frontend env.
        </div>
      )}

      <div className="bg-white border rounded p-4 shadow-sm space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Extra-long Twin Sheet Set"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Price</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g., 24.99"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Affiliate Link (Amazon)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://www.amazon.com/..."
          />
        </div>

        <div className="flex items-center gap-3">
          <UploadImageButton
            cloudName={CLOUD_NAME}
            uploadPreset={UPLOAD_PRESET}
            folder={FOLDER}
            buttonText="Upload product image"
            onUploaded={handleUploaded}
          />
          {imageUrl && (
            <div className="flex items-center gap-3">
              <img
                src={imageUrl}
                alt="preview"
                className="h-16 w-16 object-cover rounded border"
              />
              <span className="text-xs text-gray-500 break-all">{publicId}</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-950 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Product"}
          </button>
        </div>

        {msg && <p className="text-sm mt-2">{msg}</p>}
      </div>
    </div>
  );
}
