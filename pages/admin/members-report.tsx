import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

type Member = {
  id: number;
  name: string;
  email: string;
  created_at?: string | null;
};

type MembersResp = {
  totalMembers: number;
  newMembersCount?: number; // backend now returns this; if not, we show N/A
  members: Member[];
};

type VisitorsResp = {
  visitorsFromMembers: number;
  visitorsFromGuests: number;
  uniqueMemberVisits: number;
  uniqueGuestVisits: number;
  topGuestUrls?: Array<{
    page_url: string;
    total_visits: number;
    unique_guest_visits: number;
  }>;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function MembersReport() {
  const router = useRouter();

  // Default to today -> today
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [newMembersCount, setNewMembersCount] = useState<number | null>(null);

  const [visitorsMembers, setVisitorsMembers] = useState<number | null>(null);
  const [visitorsGuests, setVisitorsGuests] = useState<number | null>(null);
  const [uniqueMemberVisits, setUniqueMemberVisits] = useState<number | null>(null);
  const [uniqueGuestVisits, setUniqueGuestVisits] = useState<number | null>(null);

  const [topGuestUrls, setTopGuestUrls] = useState<
    { page_url: string; total_visits: number; unique_guest_visits: number }[]
  >([]);
  const [urlsOpen, setUrlsOpen] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [from, to]);

  function getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      // Use ONLY the original routes: /reports/members and /reports/visitors
      const [mRes, vRes] = await Promise.all([
        fetch(`${apiBase}/reports/members?${qs}`, { headers: getAuthHeaders() }),
        fetch(`${apiBase}/reports/visitors?${qs}`, { headers: getAuthHeaders() }),
      ]);

      if (mRes.status === 401 || mRes.status === 403 || vRes.status === 401 || vRes.status === 403) {
        setErr("Unauthorized. Please log in as an admin.");
        return;
      }
      if (!mRes.ok) throw new Error("Failed to fetch members report");
      if (!vRes.ok) throw new Error("Failed to fetch visitors report");

      const mData: MembersResp = await mRes.json();
      const vData: VisitorsResp = await vRes.json();

      setTotalMembers(mData.totalMembers ?? null);
      setNewMembersCount(
        typeof mData.newMembersCount === "number" ? mData.newMembersCount : null
      );

      // Ensure newest first (backend already orders by created_at DESC, but enforce here too)
      const orderedMembers = [...(mData.members || [])].sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });
      setMembersList(orderedMembers);

      setVisitorsMembers(vData.visitorsFromMembers ?? null);
      setVisitorsGuests(vData.visitorsFromGuests ?? null);
      setUniqueMemberVisits(vData.uniqueMemberVisits ?? null);
      setUniqueGuestVisits(vData.uniqueGuestVisits ?? null);
      setTopGuestUrls(vData.topGuestUrls || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyRange = () => loadAll();

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(+d)) return "—";
      return d.toLocaleString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Members & Visitors Report</h1>

      <div className="bg-white border rounded p-4 shadow-sm">
        <div className="grid sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={from}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFrom(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={to}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setTo(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="sm:col-span-2 text-sm text-gray-500">
            Showing data for <b>{from}</b> → <b>{to}</b>.
          </div>
          <div>
            <button
              onClick={applyRange}
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded px-4 py-2 font-semibold"
            >
              {loading ? "Loading…" : "Apply"}
            </button>
          </div>
        </div>
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
      </div>

      {/* Selected Period Totals */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Selected Period Totals</h2>
        <div className="grid sm:grid-cols-5 gap-3">
          <Stat label="New Members Signed Up" value={newMembersCount ?? "N/A"} />
          <Stat label="Visits — Members" value={visitorsMembers ?? "N/A"} />
          <Stat label="Visits — Guests (non-members)" value={visitorsGuests ?? "N/A"} />
          <Stat label="Total Unique Member Visits" value={uniqueMemberVisits ?? "N/A"} />
          <Stat label="Total Unique Guest Visits" value={uniqueGuestVisits ?? "N/A"} />
        </div>
      </div>

      {/* Top Guest URLs (collapsible) */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <button
          className="flex items-center gap-2 text-blue-700 font-semibold"
          onClick={() => setUrlsOpen((v) => !v)}
          aria-expanded={urlsOpen}
        >
          {urlsOpen ? "▾" : "▸"} Top Guest URLs (Guests Only)
        </button>

        {urlsOpen && (
          <div className="mt-3 overflow-x-auto">
            {topGuestUrls.length === 0 ? (
              <p className="text-sm text-gray-600">No data in this range.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">URL Path</th>
                    <th className="py-2 pr-4">Total Visits</th>
                    <th className="py-2">Unique Guest Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {topGuestUrls.map((row) => (
                    <tr key={row.page_url} className="border-b last:border-0">
                      <td className="py-2 pr-4">{row.page_url || "/"}</td>
                      <td className="py-2 pr-4">{row.total_visits}</td>
                      <td className="py-2">{row.unique_guest_visits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Members List (newest first) */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">
          Total Members: {totalMembers ?? "N/A"}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {membersList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-600">
                    No members found.
                  </td>
                </tr>
              ) : (
                membersList.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{m.name}</td>
                    <td className="py-2 pr-4">{m.email}</td>
                    <td className="py-2">{formatDateTime(m.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={() => router.push("/admin/VisitsReportGraph")}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        View Visits Report Graph
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-blue-900">{value}</div>
    </div>
  );
}
