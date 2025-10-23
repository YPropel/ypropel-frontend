import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

type Member = {
  id: number;
  name: string;
  email: string;
  created_at?: string | null; // NEW
};

type OldGuestRow = { path: string; count: number };
type NewGuestRow = {
  page_url: string;
  total_visits: number;
  unique_guest_visits: number;
  full_url?: string | null;
};

export default function MembersReport() {
  const router = useRouter();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [newMembersCount, setNewMembersCount] = useState<number | null>(null);
  const [visitorsMembers, setVisitorsMembers] = useState<number | null>(null);
  const [visitorsGuests, setVisitorsGuests] = useState<number | null>(null);
  const [uniqueMemberVisits, setUniqueMemberVisits] = useState<number | null>(null);
  const [uniqueGuestVisits, setUniqueGuestVisits] = useState<number | null>(null);
  const [topGuestRows, setTopGuestRows] = useState<Array<OldGuestRow | NewGuestRow>>([]);
  const [showGuestUrls, setShowGuestUrls] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  function getAuthHeaders() {
    const token = (typeof window !== "undefined" && localStorage.getItem("token")) || "";
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/reports/members`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error("Failed to fetch members report");
        const data = await response.json();
        setTotalMembers(data.totalMembers);
        setMembersList(data.members || []); // now includes created_at, sorted newest-first by backend
      } catch (err: any) {
        setError(err.message || "Failed to fetch members report");
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [API_BASE]);

  useEffect(() => {
    async function fetchDateData() {
      setLoading(true);
      setError(null);
      try {
        const [newMembersRes, visitorsRes] = await Promise.all([
          fetch(`${API_BASE}/reports/members/new?date=${date}`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/reports/visitors?date=${date}`, { headers: getAuthHeaders() }),
        ]);

        if (!newMembersRes.ok) throw new Error("Failed to fetch new members count");
        if (!visitorsRes.ok) throw new Error("Failed to fetch visitors report");

        const newMembersData = await newMembersRes.json();
        const visitorsData = await visitorsRes.json();

        setNewMembersCount(newMembersData.newMembersCount);
        setVisitorsMembers(visitorsData.visitorsFromMembers);
        setVisitorsGuests(visitorsData.visitorsFromGuests);
        setUniqueMemberVisits(visitorsData.uniqueMemberVisits);
        setUniqueGuestVisits(visitorsData.uniqueGuestVisits);

        // read either key
        const rows =
          visitorsData.topGuestUrls ??
          visitorsData.topGuestPaths ??
          [];
        setTopGuestRows(rows);
      } catch (err: any) {
        setError(err.message || "Failed to fetch date-specific data");
      } finally {
        setLoading(false);
      }
    }
    fetchDateData();
  }, [API_BASE, date]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Members & Visitors Report</h1>

      <button
        onClick={() => router.push("/admin/VisitsReportGraph")}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        View Visits Report Graph
      </button>

      <div className="mb-6">
        <label htmlFor="date" className="block font-semibold mb-1">
          Select Date:
        </label>
        <input
          id="date"
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Daily stats */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Statistics for {date}</h2>
            <ul className="list-disc list-inside">
              <li>New Members Signed Up: {newMembersCount ?? "N/A"}</li>
              <li>Visits - Members: {visitorsMembers ?? "N/A"}</li>
              <li>Visits - Guests (non-members): {visitorsGuests ?? "N/A"}</li>
              <li>Total Unique Member Visits: {uniqueMemberVisits ?? "N/A"}</li>
              <li>Total Unique Guest Visits: {uniqueGuestVisits ?? "N/A"}</li>
            </ul>
          </section>

          {/* Collapsible: Top Guest URLs */}
          <section className="mb-8 border rounded-lg bg-white">
            <button
              onClick={() => setShowGuestUrls((s) => !s)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-lg font-semibold text-blue-900">
                Top Guest URLs (Guests Only)
              </span>
              <span className="text-gray-500">{showGuestUrls ? "▾" : "▸"}</span>
            </button>

            {showGuestUrls && (
              <div className="px-4 pb-4">
                {topGuestRows.length === 0 ? (
                  <p className="text-sm text-gray-600">No data for selected day.</p>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full border-collapse border border-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 p-2 text-left">URL</th>
                          {isNewShape(topGuestRows) ? (
                            <>
                              <th className="border border-gray-200 p-2 text-right">Total Visits</th>
                              <th className="border border-gray-200 p-2 text-right">Unique Guests</th>
                            </>
                          ) : (
                            <th className="border border-gray-200 p-2 text-right">Unique Guest Visits</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {topGuestRows.map((row, idx) => {
                          if (isNewRow(row)) {
                            const urlText = row.page_url || "(unknown)";
                            const href = row.full_url || row.page_url || "#";
                            return (
                              <tr key={idx} className="border-t">
                                <td className="border border-gray-200 p-2">
                                  {row.full_url ? (
                                    <a
                                      className="text-blue-700 hover:underline"
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {urlText}
                                    </a>
                                  ) : (
                                    urlText
                                  )}
                                </td>
                                <td className="border border-gray-200 p-2 text-right">
                                  {row.total_visits}
                                </td>
                                <td className="border border-gray-200 p-2 text-right">
                                  {row.unique_guest_visits}
                                </td>
                              </tr>
                            );
                          } else {
                            const old = row as OldGuestRow;
                            return (
                              <tr key={idx} className="border-t">
                                <td className="border border-gray-200 p-2">{old.path || "(unknown)"}</td>
                                <td className="border border-gray-200 p-2 text-right">{old.count}</td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Members List (now shows Joined) */}
          <section>
            <h2 className="text-xl font-semibold mb-2">
              Total Members: {totalMembers ?? "N/A"}
            </h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">Name</th>
                  <th className="border border-gray-300 p-2">Email</th>
                  <th className="border border-gray-300 p-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {membersList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center p-4">
                      No members found.
                    </td>
                  </tr>
                ) : (
                  membersList.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-100">
                      <td className="border border-gray-300 p-2">{m.name}</td>
                      <td className="border border-gray-300 p-2">{m.email}</td>
                      <td className="border border-gray-300 p-2">
                        {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}

function isNewRow(row: OldGuestRow | NewGuestRow): row is NewGuestRow {
  return (row as NewGuestRow).page_url !== undefined;
}
function isNewShape(arr: Array<OldGuestRow | NewGuestRow>): arr is NewGuestRow[] {
  return arr.length > 0 && isNewRow(arr[0]);
}
