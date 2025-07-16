import React, { useState, useEffect } from "react";
import AuthGuard from "../components/AuthGuard";
import { apiFetch } from "../apiClient";


type TradeSchool = {
  id: number;
  title: string;
  state: string;
  city?: string;
  description?: string;
  website?: string;
};

//const BACKEND_BASE_URL = "http://localhost:4000"; // <-- Adjust this to your backend URL

export default function TradeSchools() {
  const [tradeSchools, setTradeSchools] = useState<TradeSchool[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Fetch distinct states from backend for filter dropdown
  useEffect(() => {
    async function fetchStates() {
      try {
       const res = await apiFetch("/trade-schools/states");

        console.log("States response status:", res.status);
        if (!res.ok) throw new Error("Failed to fetch states");
        const data = await res.json();
        console.log("States data:", data);
        setStates(data);
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    }
    fetchStates();
  }, []);

  // Fetch trade schools list with filters & pagination
  useEffect(() => {
    async function fetchTradeSchools() {
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (stateFilter) {
          queryParams.append("state", stateFilter);
        }
        const res = await apiFetch(`/trade-schools?${queryParams.toString()}`);

        console.log("Trade schools response status:", res.status);
        if (!res.ok) throw new Error("Failed to fetch trade schools");
        const data = await res.json();
        console.log("Trade schools data:", data);
        setTradeSchools(data.tradeSchools);
        setTotal(data.total);
      } catch (error) {
        console.error("Error fetching trade schools:", error);
      }
    }
    fetchTradeSchools();
  }, [stateFilter, page]);

  const totalPages = Math.ceil(total / limit);

  return (
      <AuthGuard>
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Trade Schools</h1>

      <div className="mb-6">
        <label htmlFor="stateFilter" className="mr-2 font-semibold">
          Filter by State:
        </label>
        <select
          id="stateFilter"
          className="border rounded px-2 py-1"
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All States</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {tradeSchools.length === 0 ? (
        <p>No trade schools found.</p>
      ) : (
        <ul className="space-y-4">
          {tradeSchools.map((school) => (
            <li
              key={school.id}
              className="border rounded p-4 shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold">{school.title}</h2>
              <p className="text-gray-600">
                {school.city ? `${school.city}, ` : ""}
                {school.state}
              </p>
              {school.description && <p className="mt-2">{school.description}</p>}
              {school.website && (
                <a
                  href={school.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Visit Website
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
      </AuthGuard>
  );
}
