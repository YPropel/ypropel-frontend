import React, { useState } from "react";
import { apiFetch } from "../../apiClient";

export default function ImportJobsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [source, setSource] = useState("adzuna"); // default source
  const [jobType, setJobType] = useState("entry_level"); // default job type

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

      let apiRoute = "";
      switch (source) {
        case "adzuna":
          apiRoute = "/admin/import-entry-jobs";
          break;
        case "careerjet":
          apiRoute = "/admin/import-careerjet-jobs";
          break;
        default:
          apiRoute = "/admin/import-entry-jobs";
      }

      const res = await apiFetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword: jobType === "internship" ? "internship" : "", location: "", pages: 3, job_type: jobType }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setResult(`Import failed: ${errorText}`);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setResult(`Successfully imported ${data.inserted} new jobs from ${source} (${jobType}).`);
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
      <h1 className="text-2xl font-bold mb-4">Import Jobs from Job Sources</h1>

      <label htmlFor="source" className="block mb-2 font-medium">
        Select Job Source:
      </label>
      <select
        id="source"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="mb-4 w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="adzuna">Adzuna</option>
        <option value="careerjet">Careerjet</option>
      </select>

      <label htmlFor="jobType" className="block mb-2 font-medium">
        Select Job Type:
      </label>
      <select
        id="jobType"
        value={jobType}
        onChange={(e) => setJobType(e.target.value)}
        className="mb-4 w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="entry_level">Entry Level</option>
        <option value="internship">Internship</option>
        <option value="hourly">Hourly</option>
      </select>

      <button
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleImport}
        disabled={loading}
      >
        {loading ? "Importing..." : `Import ${jobType} Jobs from ${source.charAt(0).toUpperCase() + source.slice(1)}`}
      </button>

      {result && <p className="mt-4 text-gray-800">{result}</p>}
    </div>
  );
}
