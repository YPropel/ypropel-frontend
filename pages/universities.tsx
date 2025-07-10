import React, { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
import { apiFetch } from "../apiClient";

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

// Debounce hook to delay search input changes
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function Universities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [selectedState, setSelectedState] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchKnownFor, setSearchKnownFor] = useState("");
  const limit = 100;

  // Debounce search inputs by 500ms
  const debouncedSearchName = useDebounce(searchName, 500);
  const debouncedSearchKnownFor = useDebounce(searchKnownFor, 500);

  useEffect(() => {
    setLoading(true);
    setError("");
    const offset = (page - 1) * limit;

    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("offset", String(offset));
    if (selectedState) params.append("state", selectedState);
    if (debouncedSearchName.trim() !== "")
      params.append("name", debouncedSearchName.trim());
    if (debouncedSearchKnownFor.trim() !== "")
      params.append("known_for", debouncedSearchKnownFor.trim());

    apiFetch(`/api/universities/search?${params.toString()}`)
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
  }, [page, selectedState, debouncedSearchName, debouncedSearchKnownFor]);

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    const totalPages = Math.ceil(totalCount / limit);
    if (page < totalPages) setPage(page + 1);
  };

  const states = [
    "",
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto p-6 bg-white rounded shadow">
        <h1 className="text-3xl font-semibold text-blue-900 mb-4">Universities</h1>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:space-x-6 space-y-4 md:space-y-0">
          {/* State filter */}
          <div>
            <label
              htmlFor="stateFilter"
              className="block font-semibold text-gray-700 mb-1"
            >
              Filter by State:
            </label>
            <select
              id="stateFilter"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded px-3 py-2 w-full md:w-48"
            >
              {states.map((st) => (
                <option key={st} value={st}>
                  {st === "" ? "All States" : st}
                </option>
              ))}
            </select>
          </div>

          {/* Search by university name */}
          <div className="flex-grow">
            <label
              htmlFor="searchName"
              className="block font-semibold text-gray-700 mb-1"
            >
              Search by University Name:
            </label>
            <input
              id="searchName"
              type="text"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setPage(1);
              }}
              placeholder="Enter university name"
              className="border border-gray-300 rounded px-3 py-2 w-full"
            />
          </div>

          {/* Search by known for / strong in */}
          <div className="flex-grow">
            <label
              htmlFor="searchKnownFor"
              className="block font-semibold text-gray-700 mb-1"
            >
              Search by Known For / Strong In:
            </label>
            <input
              id="searchKnownFor"
              type="text"
              value={searchKnownFor}
              onChange={(e) => {
                setSearchKnownFor(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. engineering, business, arts"
              className="border border-gray-300 rounded px-3 py-2 w-full"
            />
          </div>
        </div>

        {/* University list or loading/error */}
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
