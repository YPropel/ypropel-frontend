import React, { useState } from "react";
import { apiFetch } from "../../apiClient";

export default function ImportJobsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rssUrl, setRssUrl] = useState("");

  const handleImport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setResult("You must be logged in as admin.");
        setLoading(false);
        return;
      }

      const apiRoute = "/admin/import-simplyhired-jobs";

      const res = await apiFetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rssUrl: rssUrl.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setResult(`Import failed: ${errorText}`);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setResult(`Successfully imported ${data.inserted} new jobs.`);
      } else {
        setResult("Import failed.");
      }
    } catch (error) {
      setResult("Error occurred during import.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Import Jobs from RSS Feed</h1>

      <label htmlFor="rssUrl" className="block mb-2 font-medium">
        Enter RSS Feed URL:
      </label>
      <input
        id="rssUrl"
        type="text"
        value={rssUrl}
        onChange={(e) => setRssUrl(e.target.value)}
        placeholder="https://example.com/jobs/rss"
        className="mb-4 w-full border border-gray-300 rounded px-3 py-2"
      />

      <button
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleImport}
        disabled={loading || !rssUrl.trim()}
      >
        {loading ? "Importing..." : "Import Jobs"}
      </button>

      {result && <p className="mt-4 text-gray-800">{result}</p>}
    </div>
  );
}
