import React, { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";

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
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20; // items per page

  useEffect(() => {
    async function fetchMajors() {
      setLoading(true);
      setError(null);
      try {
        const offset = (page - 1) * limit;
        const response = await fetch(`/api/majors?limit=${limit}&offset=${offset}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch majors: ${response.statusText}`);
        }
        const data = await response.json();

        const mappedMajors: Major[] = data.majors.map((item: any) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          popularUniversities: item.popular_universities
            ? item.popular_universities.split(",").map((uni: string) => uni.trim())
            : [],
          imageUrl: item.cover_photo_url,
        }));

        setMajors(mappedMajors);
        setTotalCount(data.totalCount);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMajors();
  }, [page]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto p-6 bg-white rounded shadow space-y-6">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">Majors</h1>

        {loading && <div className="text-center text-gray-600">Loading majors...</div>}

        {error && <div className="text-center text-red-600">Error: {error}</div>}

        {!loading && !error && (
          <>
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

            {/* Pagination Controls */}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
