import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

type Member = {
  id: number;
  name: string;
  email: string;
};

type TopGuestPath = {
  path: string;
  count: number;
};

export default function MembersReport() {
  const router = useRouter();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [newMembersCount, setNewMembersCount] = useState<number | null>(null);
  const [visitorsMembers, setVisitorsMembers] = useState<number | null>(null);
  const [visitorsGuests, setVisitorsGuests] = useState<number | null>(null);
  const [uniqueMemberVisits, setUniqueMemberVisits] = useState<number | null>(null);
  const [uniqueGuestVisits, setUniqueGuestVisits] = useState<number | null>(null);
  const [topGuestPaths, setTopGuestPaths] = useState<TopGuestPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // Helper to get token and set headers
  function getAuthHeaders() {
    const token = (typeof window !== "undefined" && localStorage.getItem("token")) || "";
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  // Fetch total members and members list once on mount
  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/reports/members`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            alert("Admins only. Redirecting to login.");
            window.location.href = "/admin/login";
            return;
          }
          throw new Error("Failed to fetch members report");
        }
        const data = await response.json();
        setTotalMembers(data.totalMembers);
        setMembersList(data.members);
      } catch (err: any) {
        setError(err.message || "Failed to fetch members report");
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch new members count and visitors (including top guest URLs) for selected date
  useEffect(() => {
    async function fetchDateData() {
      setLoading(true);
      setError(null);
      try {
        // New members (for the selected date)
        const newMembersRes = await fetch(`${API_BASE}/reports/members/new?date=${date}`, {
          headers: getAuthHeaders(),
        });
        if (!newMembersRes.ok) throw new Error("Failed to fetch new members count");
        const newMembersData = await newMembersRes.json();

        // Visitors (with top guest URLs) for the selected date
        const visitorsRes = await fetch(`${API_BASE}/reports/visitors?date=${date}`, {
          headers: getAuthHeaders(),
        });
        if (!visitorsRes.ok) throw new Error("Failed to fetch visitors report");
        const visitorsData = await visitorsRes.json();

        setNewMembersCount(newMembersData.newMembersCount);
        setVisitorsMembers(visitorsData.visitorsFromMembers);
        setVisitorsGuests(visitorsData.visitorsFromGuests);
        setUniqueMemberVisits(visitorsData.uniqueMemberVisits);
        setUniqueGuestVisits(visitorsData.uniqueGuestVisits);
        setTopGuestPaths(Array.isArray(visitorsData.topGuestPaths) ? visitorsData.topGuestPaths : []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch date-specific data");
      } finally {
        setLoading(false);
      }
    }
    fetchDateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

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
          {/* Daily Stats */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Statistics for {date}</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>New Members Signed Up: {newMembersCount ?? "N/A"}</li>
              <li>Visits - Members: {visitorsMembers ?? "N/A"}</li>
              <li>Visits - Guests (non-members): {visitorsGuests ?? "N/A"}</li>
              <li>Total Unique Member Visits: {uniqueMemberVisits ?? "N/A"}</li>
              <li>Total Unique Guest Visits: {uniqueGuestVisits ?? "N/A"}</li>
            </ul>
          </section>

          {/* Top Guest URLs */}
          <section className="mb-10">
            <h3 className="text-lg font-semibold mb-2">Top Guest URLs (for {date})</h3>
            {topGuestPaths.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2 text-left">URL</th>
                      <th className="border border-gray-300 p-2 text-right">Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topGuestPaths.map((row) => (
                      <tr key={row.path} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">{row.path}</td>
                        <td className="border border-gray-300 p-2 text-right">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No guest traffic recorded for this date.</p>
            )}
          </section>

          {/* Members Table */}
          <section>
            <h2 className="text-xl font-semibold mb-2">
              Total Members: {totalMembers ?? "N/A"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 text-left">Name</th>
                    <th className="border border-gray-300 p-2 text-left">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {membersList.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center p-4">
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    membersList.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-100">
                        <td className="border border-gray-300 p-2">{member.name}</td>
                        <td className="border border-gray-300 p-2">{member.email}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
