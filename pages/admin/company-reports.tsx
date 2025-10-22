/* pages/admin/reports/companies.tsx */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../../apiClient";

type SummaryResponse = {
  non_admin: {
    companies_created: number;
    paid_jobs: number;
    free_jobs: number;
  };
  admin: {
    companies_created: number;
    paid_jobs: number;
    free_jobs: number;
  };
  all_time_companies: {
    non_admin: number;
    admin: number;
    total: number;
  };
};

type DailyCompaniesRow = { day: string; companies: number };
type DailyJobsRow = { day: string; total_jobs: number; paid_jobs: number; free_jobs: number };

type JobsByCompanyRow = {
  company_id: number;
  company_name: string;
  owner_user_id?: number;
  owner_total_companies_all_time?: number;
  total_jobs: number;
  paid_jobs: number;
  free_jobs: number;
  first_job_posted_at: string | null;
  last_job_posted_at: string | null;
  free_jobs_used_total: number;
};

const fmtDate = (iso: string | null | undefined) =>
  !iso ? "—" : new Date(iso).toLocaleDateString();

const getToken = () => (typeof window === "undefined" ? "" : localStorage.getItem("token") || "");

export default function CompaniesReportsAdmin() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // filters
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [q, setQ] = useState<string>("");

  // data
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [dailyCompanies, setDailyCompanies] = useState<DailyCompaniesRow[]>([]);
  const [dailyJobs, setDailyJobs] = useState<DailyJobsRow[]>([]);
  const [jobsByCompany, setJobsByCompany] = useState<JobsByCompanyRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // ---- auth check (basic) ----
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthorized(false);
      if (typeof window !== "undefined") {
        alert("❌ You must be logged in as admin.");
        window.location.href = "/admin/login";
      }
      return;
    }
    setIsAuthorized(true);
  }, []);

  // build query string for fetches
  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [from, to]);

  const qsWithSearch = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [from, to, q]);

  const handleAuthError = (status: number) => {
    if (status === 401 || status === 403) {
      setMsg("❌ Unauthorized. Redirecting to login…");
      localStorage.removeItem("token");
      setTimeout(() => (window.location.href = "/admin/login"), 1200);
      return true;
    }
    return false;
  };

  const fetchAll = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setMsg("");

    try {
      const [s, dc, dj, jbc] = await Promise.all([
        apiFetch(`/reports/companies/summary${qs ? `?${qs}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`/reports/companies/daily${qs ? `?${qs}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`/reports/companies/jobs-daily${qs ? `?${qs}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiFetch(`/reports/companies/jobs-by-company${qsWithSearch ? `?${qsWithSearch}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if ([s, dc, dj, jbc].some((r) => handleAuthError(r.status))) return;

      if (!s.ok || !dc.ok || !dj.ok || !jbc.ok) {
        setMsg("Failed to load one or more report endpoints.");
        return;
      }

      const [sData, dcData, djData, jbcData] = await Promise.all([
        s.json(),
        dc.json(),
        dj.json(),
        jbc.json(),
      ]);

      setSummary(sData);
      setDailyCompanies(dcData || []);
      setDailyJobs(djData || []);
      setJobsByCompany(jbcData || []);
    } catch (err) {
      console.error(err);
      setMsg("Server error while loading reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  // re-fetch when filters change
  const onApplyFilters = () => fetchAll();

  if (isAuthorized === null) return <p className="p-4">Loading…</p>;
  if (isAuthorized === false) return null;

  const periodHint =
    from || to
      ? `for ${from || "…"} → ${to || "…"}`
      : "for last 30 days (default)";

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-blue-900">Employer / Companies Reports</h1>

      {/* Filters */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <div className="grid sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-1">
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Search by Company Name</label>
            <input
              type="text"
              placeholder="e.g. YPropel"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="sm:col-span-1">
            <button
              onClick={onApplyFilters}
              disabled={loading}
              className="w-full bg-blue-900 text-white rounded px-4 py-2 font-semibold"
            >
              {loading ? "Loading…" : "Apply"}
            </button>
          </div>
        </div>
        {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}
        <p className="text-xs text-gray-500 mt-2">Showing data {periodHint}.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Non-admin period */}
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-blue-900 mb-2">Non-Admin (Selected Period)</h2>
          <div className="grid grid-cols-3 gap-3">
            <SummaryStat label="Companies" value={summary?.non_admin.companies_created} />
            <SummaryStat label="Paid Jobs" value={summary?.non_admin.paid_jobs} />
            <SummaryStat label="Free Jobs" value={summary?.non_admin.free_jobs} />
          </div>
        </div>

        {/* Admin period */}
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-blue-900 mb-2">Admin (Selected Period)</h2>
          <div className="grid grid-cols-3 gap-3">
            <SummaryStat label="Companies" value={summary?.admin.companies_created} />
            <SummaryStat label="Paid Jobs" value={summary?.admin.paid_jobs} />
            <SummaryStat label="Free Jobs" value={summary?.admin.free_jobs} />
          </div>
        </div>
      </div>

      {/* All-time companies */}
      <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
        <h3 className="font-semibold text-emerald-900 mb-1">All-Time Companies (ignores date)</h3>
        <p className="text-sm text-emerald-800">
          Admin: <b>{summary?.all_time_companies.admin ?? 0}</b> &nbsp;•&nbsp; Non-Admin:{" "}
          <b>{summary?.all_time_companies.non_admin ?? 0}</b> &nbsp;•&nbsp; Total:{" "}
          <b>{summary?.all_time_companies.total ?? 0}</b>
        </p>
      </div>

      {/* Daily Companies */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <h2 className="font-semibold text-blue-900 mb-3">Daily Companies (Selected Period)</h2>
        {dailyCompanies.length === 0 ? (
          <p className="text-sm text-gray-600">No data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Day</th>
                  <th className="py-2">Companies</th>
                </tr>
              </thead>
              <tbody>
                {dailyCompanies.map((row) => (
                  <tr key={row.day} className="border-b last:border-0">
                    <td className="py-2 pr-4">{fmtDate(row.day)}</td>
                    <td className="py-2">{row.companies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Jobs */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <h2 className="font-semibold text-blue-900 mb-3">Daily Jobs (Selected Period)</h2>
        {dailyJobs.length === 0 ? (
          <p className="text-sm text-gray-600">No data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Day</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Paid</th>
                  <th className="py-2">Free</th>
                </tr>
              </thead>
              <tbody>
                {dailyJobs.map((row) => (
                  <tr key={row.day} className="border-b last:border-0">
                    <td className="py-2 pr-4">{fmtDate(row.day)}</td>
                    <td className="py-2 pr-4">{row.total_jobs}</td>
                    <td className="py-2 pr-4">{row.paid_jobs}</td>
                    <td className="py-2">{row.free_jobs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Jobs by Company */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-blue-900">Jobs by Company (Selected Period)</h2>
          {q.trim() && <span className="text-xs text-gray-500">Filter: “{q.trim()}”</span>}
        </div>

        {jobsByCompany.length === 0 ? (
          <p className="text-sm text-gray-600">No data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Total Jobs</th>
                  <th className="py-2 pr-4">Paid</th>
                  <th className="py-2 pr-4">Free</th>
                  <th className="py-2 pr-4">Free Jobs Used</th>
                  <th className="py-2 pr-4">First Posted</th>
                  <th className="py-2">Last Posted</th>
                </tr>
              </thead>
              <tbody>
                {jobsByCompany.map((row) => (
                  <tr key={row.company_id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <div className="font-medium text-blue-900">{row.company_name}</div>
                      {/* If you enabled owner_total_companies_all_time in backend, show it */}
                      {typeof row.owner_total_companies_all_time === "number" && (
                        <div className="text-xs text-gray-500">
                          Owner total companies (all-time): {row.owner_total_companies_all_time}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-4">{row.total_jobs}</td>
                    <td className="py-2 pr-4">{row.paid_jobs}</td>
                    <td className="py-2 pr-4">{row.free_jobs}</td>
                    <td className="py-2 pr-4">{row.free_jobs_used_total}</td>
                    <td className="py-2 pr-4">{fmtDate(row.first_job_posted_at)}</td>
                    <td className="py-2">{fmtDate(row.last_job_posted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded border p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-blue-900">{value ?? 0}</div>
    </div>
  );
}
