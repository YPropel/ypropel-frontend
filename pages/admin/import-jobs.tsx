import React, { useState } from "react";
import { apiFetch } from "../../apiClient";

export default function ImportJobsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [source, setSource] = useState("adzuna"); // default source
  const [jobType, setJobType] = useState("entry_level"); // default job type
  const [rssUrl, setRssUrl] = useState(""); // SimplyHired only
  const [emailHtml, setEmailHtml] = useState(""); // LinkedIn Newsletter only
  const [gmailEmails, setGmailEmails] = useState<any[]>([]); // Store fetched emails

  function getTokenOrRedirect() {
    const token = localStorage.getItem("token");
    if (!token) {
      setResult("❌ You must be logged in.");
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/admin/login";
      }, 1500);
      setLoading(false);
      return null;
    }
    return token;
  }

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    setGmailEmails([]);

    try {
      const token = getTokenOrRedirect();
      if (!token) return;

      let apiRoute = "";
      const bodyData: any = {
        keyword: jobType === "internship" ? "internship" : "",
        location: "United States",
        pages: 3,
        job_type: jobType,
      };

      if (source === "adzuna") {
        apiRoute = "/admin/import-entry-jobs";
      } else if (source === "careerjet") {
        if (jobType === "hourly") {
          apiRoute = "/admin/import-careerjet-hourly-jobs";
        } else if (jobType === "internship") {
          apiRoute = "/admin/import-careerjet-intern-jobs";
        } else {
          apiRoute = "/admin/import-careerjet-jobs";
        }
      } else if (source === "sunnova") {
        apiRoute = "/admin/import-sunnova-jobs";
      } else if (source === "simplyhired") {
        apiRoute = "/admin/import-simplyhired-jobs";
        bodyData.rssUrl = rssUrl.trim();
      } else if (source === "reddit") {
        apiRoute = "/admin/import-reddit-internships";
      } else if (source === "remotive") {
        apiRoute = "/admin/import-remotive-internships";
      } else if (source === "linkedin") {
        apiRoute = "/admin/import-linkedin-newsletter";
        bodyData.emailHtml = emailHtml.trim();
      } else if (source === "gmail") {
        apiRoute = "/admin/fetch-gmail-emails";
        // No token passed here anymore, backend uses stored token.json
        // Clear bodyData so it’s empty object
        Object.keys(bodyData).forEach(key => delete bodyData[key]);
      } else {
        apiRoute = "/admin/import-entry-jobs";
      }

      // Validate inputs for special sources
      if (source === "linkedin" && !bodyData.emailHtml) {
        setResult("❌ Please paste the LinkedIn newsletter email HTML content.");
        setLoading(false);
        return;
      }

      if (source === "simplyhired" && !bodyData.rssUrl) {
        setResult("❌ Please enter the SimplyHired RSS feed URL.");
        setLoading(false);
        return;
      }

      const res = await apiFetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (res.status === 401 || res.status === 403) {
        setResult("❌ Unauthorized. Redirecting to login...");
        localStorage.removeItem("token");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 1500);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        setResult(`Import failed: ${errorText}`);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (source === "gmail" && data.emails) {
        setGmailEmails(data.emails);
        setResult(`Fetched ${data.emails.length} emails from Gmail.`);
      } else if (data.success || data.inserted !== undefined || data.message) {
        setResult(
          `Successfully imported ${
            data.inserted ?? "some"
          } new jobs from ${
            source === "reddit"
              ? "Reddit internships"
              : source === "remotive"
              ? "Remotive internships"
              : source === "linkedin"
              ? "LinkedIn newsletter"
              : source
          }.`
        );
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
      <h1 className="text-2xl font-bold mb-4">Import Jobs</h1>

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
        <option value="sunnova">Sunnova</option>
        <option value="simplyhired">SimplyHired</option>
        <option value="reddit">Reddit r/internships</option>
        <option value="remotive">Remotive Internships</option>
        <option value="linkedin">LinkedIn Newsletter</option>
        <option value="gmail">Gmail Inbox</option>
      </select>

      {/* Show job type only if not LinkedIn or Gmail */}
      {source !== "linkedin" && source !== "gmail" && (
        <>
          <label htmlFor="jobType" className="block mb-2 font-medium">
            Select Job Type:
          </label>
          <select
            id="jobType"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="mb-6 w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="entry_level">Entry Level</option>
            <option value="hourly">Hourly</option>
            <option value="internship">Internship</option>
          </select>
        </>
      )}

      {/* RSS URL input only for SimplyHired */}
      {source === "simplyhired" && (
        <>
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
        </>
      )}

      {/* Textarea for pasting LinkedIn newsletter email HTML */}
      {source === "linkedin" && (
        <>
          <label htmlFor="emailHtml" className="block mb-2 font-medium">
            Paste LinkedIn Newsletter Email HTML:
          </label>
          <textarea
            id="emailHtml"
            value={emailHtml}
            onChange={(e) => setEmailHtml(e.target.value)}
            placeholder="Paste the full LinkedIn newsletter email HTML content here..."
            className="mb-4 w-full border border-gray-300 rounded px-3 py-2 h-40"
          />
        </>
      )}

      <button
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleImport}
        disabled={
          loading ||
          (source === "simplyhired" && !rssUrl.trim()) ||
          (source === "linkedin" && !emailHtml.trim())
        }
      >
        {loading
          ? "Importing..."
          : `Import ${
              source === "linkedin"
                ? "LinkedIn Newsletter Jobs"
                : jobType.charAt(0).toUpperCase() + jobType.slice(1)
            } Jobs from ${
              source === "reddit"
                ? "Reddit internships"
                : source === "remotive"
                ? "Remotive internships"
                : source.charAt(0).toUpperCase() + source.slice(1)
            }`}
      </button>

      {result && <p className="mt-4 text-gray-800">{result}</p>}

      {/* Show Gmail emails if fetched */}
      {gmailEmails.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Fetched Gmail Emails:</h2>
          <ul className="list-disc pl-5 max-h-64 overflow-auto border border-gray-300 rounded p-3">
            {gmailEmails.map((email) => (
              <li key={email.id}>
                <strong>Snippet:</strong> {email.snippet || "(no snippet)"}
                <br />
                <strong>Date:</strong> {new Date(Number(email.internalDate)).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
