import React, { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";

type University = {
  id: string;
  title: string;
  website: string;
  description: string;
  country: string;
  state: string;
  city: string;
};

type ApiResponse = {
  totalCount: number;
  universities: University[];
};

export default function Universities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [selectedState, setSelectedState] = useState("");
  const limit = 100;

  useEffect(() => {
    setLoading(true);
    setError("");
    const offset = (page - 1) * limit;

    // Append state filter if selected
    const stateQuery = selectedState ? `&state=${selectedState}` : "";

    fetch(`http://localhost:4000/api/universities?limit=${limit}&offset=${offset}${stateQuery}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch universities");
        return res.json();
      })
      .then((data: ApiResponse) => {
        setUniversities(data.universities);
        setTotalCount(data.totalCount);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, [page, selectedState]);

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    const totalPages = Math.ceil(totalCount / limit);
    if (page < totalPages) setPage(page + 1);
  };

  // US state abbreviations for filter dropdown
  const states = [
    "", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
    "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
    "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX",
    "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  return (
      <AuthGuard>
    <div className="max-w-7xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-3xl font-semibold text-blue-900 mb-4">Universities</h1>

      {/* State filter dropdown */}
      <div className="mb-6">
        <label htmlFor="stateFilter" className="mr-4 font-semibold text-gray-700">
          Filter by State:
        </label>
        <select
          id="stateFilter"
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setPage(1); // Reset page when filter changes
          }}
          className="border border-gray-300 rounded px-3 py-2"
        >
          {states.map((st) => (
            <option key={st} value={st}>
              {st === "" ? "All States" : st}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-6 text-center">Loading universities...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">Error: {error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-6">
            {universities.map((uni) => (
              <div
                key={uni.id}
                className="border rounded shadow hover:shadow-lg transition p-4 flex flex-col"
              >
               <h2 className="text-lg font-semibold text-blue-800">{uni.title}</h2>
                <p className="italic text-gray-600 mb-1">
                  {uni.city}, {uni.state}, {uni.country}
                </p>
                <p className="flex-grow text-blue-900 mb-4">{uni.description}</p>
                <a
                  href={uni.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 font-semibold text-center"
                >
                  Visit Website
                </a>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className={`px-4 py-2 rounded ${
                page === 1
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Previous
            </button>
            <span className="self-center text-gray-700">Page {page}</span>
            <button
              onClick={handleNext}
              disabled={page >= Math.ceil(totalCount / limit)}
              className={`px-4 py-2 rounded ${
                page >= Math.ceil(totalCount / limit)
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
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
