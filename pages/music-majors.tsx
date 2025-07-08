import React, { useState, useEffect } from "react";
import AuthGuard from "../components/AuthGuard";
type MusicMajor = {
  id: number;
  title: string;
  description: string;
  top_universities?: string;
  cover_photo_url?: string;
};

const BACKEND_BASE_URL = "http://localhost:4000";

export default function MusicMajors() {
  const [majors, setMajors] = useState<MusicMajor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMajors() {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/music-majors`);
        if (!res.ok) throw new Error(`Failed to fetch music majors: ${res.statusText}`);
        const data = await res.json();
        setMajors(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchMajors();
  }, []);

  if (loading) return <p className="p-6">Loading music majors...</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <AuthGuard>
    <div className="max-w-7xl mx-auto p-6 bg-white rounded shadow">
      <h1
        className="text-3xl font-semibold text-blue-900 mb-4"
        style={{ color: "#001f4d" }} // dark navy blue header
      >
        Popular Music Majors
      </h1>
      {majors.length === 0 ? (
        <p>No music majors found.</p>
      ) : (
        <ul className="space-y-6">
          {majors.map(({ id, title, description, top_universities, cover_photo_url }) => (
            <li
              key={id}
              className="border rounded p-4 shadow-sm hover:shadow-md transition flex items-center gap-4"
            >
              {cover_photo_url && (
                <img
                  src={cover_photo_url}
                  alt={title}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-gray-700">{description}</p>
                {top_universities && (
                  <p className="mt-2 italic text-sm text-green-700">
                    <strong>Top Universities:</strong> {top_universities}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
    </AuthGuard>
  );
}
