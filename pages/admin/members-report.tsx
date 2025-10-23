import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

type Member = {
  id: number;
  name: string;
  email: string;
  created_at?: string; // optional - sort if present
};

type TopGuestPath = { path: string; count: number };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// helper: headers with token
function getAuthHeaders() {
  const token = (typeof window !== "undefined" && localStorage.getItem("token")) || "";
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// helper: iterate dates inclusive
function* eachDay(fromISO: string, toISO: string) {
  const start = new Date(fromISO);
  const end = new Date(toISO);
  for (
    let d = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    d <= new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    yield d.toISOString().slice(0, 10);
  }
}

export default function MembersReport() {
  const router = useRouter();

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // last 7 days default
  );
  const [to, setTo] = useState(todayISO);

  // top KPIs
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [rangeNewSignups, setRangeNewSignups] = useState<number | null>(null);
  const [rangeUniqueGuests, setRangeUniqueGuests] = useState<number | null>(null);
  const [todayUniqueGuests, setTodayUniqueGuests] = useState<number | null>(null);
  const [urlsOpen, setUrlsOpen] = useState(false); // collapsed by default


  // per-day/paths
  const [topGuestPaths, setTopGuestPaths] = useState<TopGuestPath[]>([]);

  // other UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetch total members + full list (once)
  useEffect(() => {
    let alive = true;
    (async () => {
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/reports/members`, { headers: getAuthHeaders() });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            alert("Admins only. Redirecting to login.");
            window.location.href = "/admin/login";
            return;
          }
          throw new Error("Failed to fetch members report");
        }
        const data = await res.json();
        if (!alive) return;
        setTotalMembers(data.totalMembers);

        // Sort newest -> oldest IF backend includes created_at
        const list: Member[] = Array.isArray(data.members) ? data.members : [];
        const sorted = [...list].sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0; // fallback: keep server order
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setMembersList(sorted.length ? sorted : list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to fetch members report");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // fetch range aggregates + today's unique guests + top guest URLs for the TO day
  async function loadRange() {
    setLoading(true);
    setError(null);
    try {
      // guard range
      if (!from || !to) throw new Error("Please select a valid date range.");
      if (from > to) throw new Error("From date must be before or equal to To date.");

      // aggregate by iterating existing single-day endpoints
      const dayList = Array.from(eachDay(from, to));

      // Run calls in small batches to avoid hammering the server for very long ranges
      const chunkSize = 10;
      let totalNew = 0;
      let totalUniqueGuests = 0;

      for (let i = 0; i < dayList.length; i += chunkSize) {
        const chunk = dayList.slice(i, i + chunkSize);

        const newMembersPromises = chunk.map((d) =>
          fetch(`${API_BASE}/reports/members/new?date=${d}`, { headers: getAuthHeaders() }).then((r) => r.json())
        );
        const visitorsPromises = chunk.map((d) =>
          fetch(`${API_BASE}/reports/visitors?date=${d}`, { headers: getAuthHeaders() }).then((r) => r.json())
        );

        const newMembersResults = await Promise.all(newMembersPromises);
        const visitorsResults = await Promise.all(visitorsPromises);

        totalNew += newMembersResults.reduce((acc, obj) => acc + (Number(obj?.newMembersCount) || 0), 0);
        totalUniqueGuests += visitorsResults.reduce((acc, obj) => acc + (Number(obj?.uniqueGuestVisits) || 0), 0);
      }

      setRangeNewSignups(totalNew);
      setRangeUniqueGuests(totalUniqueGuests);

      // today's unique guests (independent of range)
      const todayRes = await fetch(`${API_BASE}/reports/visitors?date=${todayISO}`, {
        headers: getAuthHeaders(),
      });
      const todayData = await todayRes.json();
      setTodayUniqueGuests(Number(todayData?.uniqueGuestVisits) || 0);

      // Top guest URLs for the TO day (so it matches the “current day” of interest in the UI)
      const toDayRes = await fetch(`${API_BASE}/reports/visitors?date=${to}`, {
        headers: getAuthHeaders(),
      });
      const toDayData = await toDayRes.json();
      setTopGuestPaths(Array.isArray(toDayData?.topGuestPaths) ? toDayData.topGuestPaths : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load reports for selected range.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // load for default range on mount
    loadRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Members & Visitors Report</h1>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block font-semibold mb-1">From</label>
          <input
            type="date"
            value={from}
            max={todayISO}
            onChange={(e) => setFrom(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">To</label>
          <input
            type="date"
            value={to}
            max={todayISO}
            onChange={(e) => setTo(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <button
          onClick={loadRange}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {loading ? "Loading…" : "Apply"}
        </button>

        <button
          onClick={() => router.push("/admin/VisitsReportGraph")}
          className="ml-auto px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition"
        >
          View Visits Report Graph
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {/* KPI cards */}
      <section className="grid sm:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Total New Sign-ups (Range)" value={rangeNewSignups ?? 0} />
        <KpiCard label="Total Unique Guests (Range)" value={rangeUniqueGuests ?? 0} />
        <KpiCard label="Today's Unique Guests" value={todayUniqueGuests ?? 0} />
      </section>

      {/* Top Guest URLs for selected "To" day */}
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Top Guest URLs (for {to})</h2>
        {topGuestPaths.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 text-left">URL</th>
                  <th className="border border-gray-300 p-2 text-right">Unique Guest Visits</th>
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

      {/* Members list (newest -> oldest if created_at present) */}
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
                <th className="border border-gray-300 p-2 text-left">Joined</th>
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
                membersList
                  .slice()
                  .sort((a, b) => {
                    if (!a.created_at || !b.created_at) return 0;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .map((member) => (
                    <tr key={member.id} className="hover:bg-gray-100">
                      <td className="border border-gray-300 p-2">{member.name}</td>
                      <td className="border border-gray-300 p-2">{member.email}</td>
                      <td className="border border-gray-300 p-2">
                        {member.created_at ? new Date(member.created_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        {!membersList.some((m) => m.created_at) && (
          <p className="text-xs text-gray-500 mt-2">
            (Tip: return <code>created_at</code> in <code>/reports/members</code> to enable proper newest→oldest ordering.)
          </p>
        )}
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border rounded bg-white">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-2xl font-semibold text-blue-900 mt-1">{value}</div>
    </div>
  );
}
