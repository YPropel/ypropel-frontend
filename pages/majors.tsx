import React, { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
import { apiFetch } from "../apiClient"; // keep your existing apiFetch as is

type Major = {
  id: number;
  title: string;
  description: string;
  popularUniversities: string[];
  imageUrl: string;
};

export default function Majors() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMajors() {
      try {
        const response = await apiFetch("/api/majors?limit=100&offset=0");
        const data = await response.json(); // parse JSON here since apiFetch does not do it

        const mappedMajors: Major[] = data.majors.map((item: any) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          popularUniversities: item.popular_universities
            ? item.popular_universities.split(",").map((uni: string) => uni.trim())
            : [],
          imageUrl: item.cover_photo_url,
        }));

        // Sort alphabetically by title
        mappedMajors.sort((a, b) => a.title.localeCompare(b.title));

        setMajors(mappedMajors);
      } catch (err: any) {
        setError(err.message || "Failed to load majors");
      } finally {
        setLoading(false);
      }
    }

    fetchMajors();
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <div className="p-6 text-center text-gray-600">Loading majors...</div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="p-6 text-center text-red-600">Error: {error}</div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto p-6 bg-white rounded shadow space-y-6">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">Majors</h1>
        <div className="flex flex-col space-y-6">
          {majors.map((major) => (
            <div
              key={major.id}
              className="flex flex-col md:flex-row border rounded shadow hover:shadow-lg transition p-4"
            >
              {/* Details Left */}
              <div className="flex-1 pr-4">
                <h2 className="text-2xl font-semibold text-blue-800 mb-2">{major.title}</h2>
                <p className="text-gray-800 mb-4">{major.description}</p>
                {major.popularUniversities.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">Popular Universities:</p>
                    <ul className="list-disc list-inside text-gray-600">
                      {major.popularUniversities.map((uni, idx) => (
                        <li key={idx}>{uni}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <a
                  href="#"
                  className="mt-4 inline-block text-blue-700 font-semibold hover:underline"
                >
                  Learn More
                </a>
              </div>

              {/* Image Right */}
              <div className="flex-shrink-0 mt-4 md:mt-0 md:ml-4 w-full md:w-48 h-32 rounded overflow-hidden">
                <img
                  src={major.imageUrl}
                  alt={`${major.title} image`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
