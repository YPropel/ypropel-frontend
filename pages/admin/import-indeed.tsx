/* pages/admin/import-indeed.tsx */
import React, { useState, useEffect } from "react";
import { apiFetch } from "../../apiClient";

export default function ImportIndeed() {
  const [file, setFile] = useState<File | null>(null);
  const [resJson, setResJson] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => {
    if (!token) {
      alert("❌ Admin only. Please log in.");
      window.location.href = "/admin/login";
    }
  }, [token]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setMsg("Please select a CSV file."); return; }
    setLoading(true); setMsg(""); setResJson(null);

    try {
      const form = new FormData();
      form.append("file", file, file.name);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/admin/import/indeed`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } as any : undefined,
          body: form,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Import failed.");
      } else {
        setResJson(data);
        setMsg("✅ Import finished.");
      }
    } catch (err: any) {
      setMsg(err?.message || "Upload error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-blue-900">Admin: Import Indeed CSV</h1>

      <form onSubmit={handleUpload} className="bg-white border rounded p-4 space-y-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-900 text-white rounded disabled:opacity-60"
        >
          {loading ? "Uploading…" : "Upload & Import"}
        </button>
      </form>

      {msg && <p className="text-sm">{msg}</p>}

      {resJson && (
        <div className="bg-gray-50 border rounded p-4 text-sm">
          <div><b>Inserted:</b> {resJson.inserted}</div>
          <div><b>Updated:</b> {resJson.updated}</div>
          <div><b>Skipped:</b> {resJson.skipped}</div>
          {Array.isArray(resJson.errors) && resJson.errors.length > 0 && (
            <>
              <div className="mt-2 font-semibold">Errors (first 10):</div>
              <ul className="list-disc list-inside">
                {resJson.errors.slice(0, 10).map((e: any, i: number) => (
                  <li key={i}>Row {e.row}: {e.error}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
