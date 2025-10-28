import React, { useEffect, useState } from "react";
import { apiFetch } from "../../apiClient";

const CATEGORY_SLUG = "dorm-essentials";

export default function AdminShop() {
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [priceText, setPriceText] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const openWidget = () => {
    // @ts-ignore
    const cloudinary = window.cloudinary;
    if (!cloudinary) return alert("Cloudinary widget not loaded yet.");
    const widget = cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: "ypropel_shop_unsigned",
        folder: "ypropel/shop",
        multiple: false,
        sources: ["local", "url", "camera"],
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setImageUrl(result.info.secure_url);
        }
      }
    );
    widget.open();
  };

  const saveProduct = async () => {
    setMsg("");
    if (!imageUrl || !title || !affiliateUrl) return setMsg("Please add image, title, and affiliate URL.");

    // ensure ?tag= is present (your Amazon Associate tag)
    if (!/[\?&]tag=/.test(affiliateUrl)) {
      return setMsg("Affiliate URL must include your Amazon tag (e.g., ?tag=yourtag-20).");
    }

    const token = localStorage.getItem("token");
    const res = await apiFetch("/admin/shop/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        category_slug: CATEGORY_SLUG,
        title,
        note,
        price_text: priceText,
        image_url: imageUrl,
        affiliate_url: affiliateUrl,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setMsg(data.error || "Failed to save product.");
    }
    setMsg("✅ Product saved.");
    setTitle(""); setNote(""); setPriceText(""); setAffiliateUrl(""); setImageUrl("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold text-blue-900">Admin • Dorm Essentials</h1>

      <div className="space-y-2">
        <label className="block text-sm">Image</label>
        <button onClick={openWidget} className="px-3 py-2 bg-blue-900 text-white rounded">Upload Image</button>
        {imageUrl && <img src={imageUrl} alt="preview" className="w-40 h-40 object-cover rounded border mt-2" />}
      </div>

      <div>
        <label className="block text-sm">Title</label>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} className="border rounded w-full px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm">Note (optional)</label>
        <textarea value={note} onChange={(e)=>setNote(e.target.value)} className="border rounded w-full px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm">Price label (optional)</label>
        <input value={priceText} onChange={(e)=>setPriceText(e.target.value)} className="border rounded w-full px-3 py-2" placeholder="e.g., Typically $19–$25" />
      </div>

      <div>
        <label className="block text-sm">Amazon Affiliate URL (include ?tag=yourtag-20)</label>
        <input value={affiliateUrl} onChange={(e)=>setAffiliateUrl(e.target.value)} className="border rounded w-full px-3 py-2" placeholder="https://www.amazon.com/dp/ASIN?tag=yourtag-20" />
      </div>

      <button onClick={saveProduct} className="px-4 py-2 bg-emerald-600 text-white rounded">Save Product</button>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </div>
  );
}
