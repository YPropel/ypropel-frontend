import React, { useState, useEffect, ChangeEvent } from "react";
import AuthGuard from "../components/AuthGuard";

type Resume = {
  id: number;
  resume_url: string;
  file_name: string;
  created_at: string;
};

export default function ResumeManager() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch resumes for the logged-in user
  const fetchResumes = async () => {
    setLoadingResumes(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("http://localhost:4000/members/resumes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch resumes");
      }

      const data = await res.json();
      setResumes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("http://localhost:4000/members/resumes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setMessage("Upload successful!");
      setFile(null);
      fetchResumes(); // Refresh list after upload
    } catch (error: any) {
      setMessage("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resumeId: number) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`http://localhost:4000/members/resumes/${resumeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete resume");
      }

      setMessage("Resume deleted successfully");
      fetchResumes();
    } catch (err: any) {
      setMessage("Delete failed: " + err.message);
    }
  };

  return (
     <AuthGuard>
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Upload Your Resume</h1>

      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full border p-2 rounded"
        accept=".pdf,.doc,.docx"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-900 text-white px-4 py-2 rounded mt-4 hover:bg-blue-800 disabled:opacity-50"
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}

      <hr className="my-6" />

      <h2 className="text-2xl font-semibold mb-4">Your Uploaded Resumes</h2>

      {loadingResumes ? (
        <p>Loading resumes...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : resumes.length === 0 ? (
        <p>No resumes uploaded yet.</p>
      ) : (
        <ul className="space-y-3">
          {resumes.map((resume) => (
            <li key={resume.id} className="border rounded p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{resume.file_name}</p>
                <p className="text-sm text-gray-600">Uploaded: {new Date(resume.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={resume.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(resume.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
     </AuthGuard>
  );
}
