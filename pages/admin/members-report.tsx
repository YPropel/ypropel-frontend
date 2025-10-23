import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

type Member = {
  id: number;
  name: string;
  email: string;
  created_at?: string | null;
};

type OldGuestRow = { path: string; count: number };
type NewGuestRow = {
  page_url: string;
  total_visits: number;
  unique_guest_visits: number;
  full_url?: string | null;
};

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

export default function MembersReport() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // default to last 7 days
  const todayISO = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  // filters (same layout/behavior as Companies Reports)
  const [from, setFrom] = useState<string>(sevenDaysAgo);
  const [to, setTo] = useState<string>(todayISO);

  // data
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [newMembersCount, setNewMembersCount] = useState<number | null>(null);
  const [visitorsMembers, setVisitorsMembers] = useState<number | null>(null);
  const [visitorsGuests, setVisitorsGuests] = useState<number | null>(null);
  const [uniqueMemberVisits, setUniqueMemberVisits] = useState<number | null>(null);
  const [uniqueGuestVisits, setUniqueGuestVisits] = useState<number | null>(null);
  const [topGuestRows, setTopGuestRows] = useState<Array<OldGuestRow | NewGuestRow>>([]);

  // ui state
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [showGuestUrls, setShowGuestUrls] = useState<boolean>(false);

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""),
    []
  );
  const headers = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" }),
    [token]
  );

  // load total members + full list (newest-first from backend)
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(`${API_BASE}/reports/members`, { headers });
        if (!res.ok) throw new Error("Failed to fetch members report");
        const data = await res.json();
        setTotalMembers(data.totalMembers ?? null);
        setMembersList(Array.isArray(data.members) ? data.members : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load members.");
      }
    }
    fetchMembers();
  }, [API_BASE, headers]);

  async function fetchRange() {
    setLoading(true);
    setMsg("");
    try {
      const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

      const [newMembersRes, visitorsRes] = await Promise.all([
        fetch(`${API_BASE}/reports/members/new?${qs}`, { headers }),
        fetch(`${API_BASE}/reports/visitors?${qs}`, { headers }),
      ]);

      if (!newMembersRes.ok) throw new Error("Failed to fetch new members count");
      if (!visitorsRes.ok) throw new Error("Failed to fetch visitors report");

      const newMembersData = await newMembersRes.json();
      const visitorsData = await visitorsRes.json();

      setNewMembersCount(newMembersData.newMembersCount ?? 0);
      setVisitorsMembers(visitorsData.visitorsFromMembers ?? 0);
      setVisitorsGuests(visitorsData.visitorsFromGuests ?? 0);
      setUniqueMemberVisits(visitorsData.uniqueMemberVisits ?? 0);
      setUniqueGuestVisits(visitorsData.uniqueGuestVisits ?? 0);

      const rows =
        visitorsData.topGuestUrls ??
        visitorsData.topGuestPaths ??
        [];
      setTopGuestRows(rows);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load range data.");
    } finally {
      setLoading(false);
    }
  }

  // initial fetch for default range
  useEffect(() => {
    fetchRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const periodHint = `${from || "…"} → ${to || "…"}`;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Members & Visitors Report</h1>

      <button
        onClick={() => router.push("/admin/VisitsReportGraph")}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        View Visits Report Graph
      </button>

      {/* Filters — same layout used on the Companies Reports page */}
      <div className="bg-white border rounded p-4 shadow-sm mb-6">
        <div className="grid sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border rounded px-3 py-2"
              max={to || undefined}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              min={from || undefined}
              max={todayISO}
            />
          </div>
          <div className="sm:col-span-1">
            <button
              onClick={fetchRange}
              disabled={loading}
              className="w-full bg-blue-900 text-white rounded px-4 py-2 font-semibold"
            >
              {loading ? "Loading…" : "Apply"}
            </button>
          </div>
        </div>
        {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}
        <p className="text-xs text-gray-500 mt-2">Showing data for {periodHint}.</p>
      </div>

      {/* Summary for selected period */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Selected Period Totals</h2>
        <ul className="list-disc list-inside">
          <li>New Members Signed Up: {newMembersCount ?? "N/A"}</li>
          <li>Visits — Members: {visitorsMembers ?? "N/A"}</li>
          <li>Visits — Guests (non-members): {visitorsGuests ?? "N/A"}</li>
          <li>Total Unique Member Visits: {uniqueMemberVisits ?? "N/A"}</li>
          <li>Total Unique Guest Visits: {uniqueGuestVisits ?? "N/A"}</li>
        </ul>
      </section>

      {/* Collapsible Guest URLs (Guests only) */}
      <section className="mb-8 border rounded-lg bg-white">
        <button
          onClick={() => setShowGuestUrls((s) => !s)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-lg font-semibold text-blue-900">Top Guest URLs (Guests Only)</span>
          <span className="text-gray-500">{showGuestUrls ? "▾" : "▸"}</span>
        </button>

        {showGuestUrls && (
          <div className="px-4 pb-4">
            {topGuestRows.length === 0 ? (
              <p className="text-sm text-gray-600">No data in this range.</p>
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
                            <td className="border border-gray-200 p-2 text-right">{row.total_visits}</td>
                            <td className="border border-gray-200 p-2 text-right">{row.unique_guest_visits}</td>
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

      {/* Members list (newest first; backend orders) */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Total Members: {totalMembers ?? "N/A"}</h2>
        <div className="overflow-auto">
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
                    <td className="border border-gray-300 p-2">{fmt(m.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function isNewRow(row: OldGuestRow | NewGuestRow): row is NewGuestRow {
  return (row as NewGuestRow).page_url !== undefined;
}
function isNewShape(arr: Array<OldGuestRow | NewGuestRow>): arr is NewGuestRow[] {
  return arr.length > 0 && isNewRow(arr[0]);
}
