import React, { useState } from "react";
import { apiFetch } from "../../apiClient";

export default function ImportJobsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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

      const res = await apiFetch("/adminbackend/import-entry-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword: "", location: "", page: 1 }),
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
      <h1 className="text-2xl font-bold mb-4">Import Entry-Level Jobs from Adzuna</h1>
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleImport}
        disabled={loading}
      >
        {loading ? "Importing..." : "Import Jobs Now"}
      </button>
      {result && <p className="mt-4 text-gray-800">{result}</p>}
    </div>
  );
}
