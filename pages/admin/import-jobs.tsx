import React, { useState } from "react";
import { apiFetch } from "../apiClient"; // adjust import path as needed

export default function ImportJobsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const data = await apiFetch("/admin/import-entry-jobs", {
        method: "POST",
        body: JSON.stringify({ keyword: "", location: "", page: 1 }),
      });

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
