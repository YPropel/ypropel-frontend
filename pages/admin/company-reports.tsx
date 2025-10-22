/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import { apiFetch } from "../../apiClient";

type DailyCompaniesRow = { day: string; companies: number };
type JobsDailyRow = { day: string; total_jobs: number; free_jobs: number; paid_jobs: number };
type JobsByCompanyRow = {
  company_id: number;
  company_name: string;
  total_jobs: number;
  free_jobs: number;
  paid_jobs: number;
  first_job_posted_at: string | null;
  last_job_posted_at: string | null;
  free_jobs_used_total: number | null;
};

type SummaryResp = {
  non_admin: { companies_created: number; paid_jobs: number; free_jobs: number };
  admin:     { companies_created: number; paid_jobs: number; free_jobs: number };
  // new: all-time totals (ignores date filters)
  all_time_companies?: {
    non_admin: number;
    admin: number;
    total: number;
  };
};

export default function CompanyReportsPage() {
  // auth gate (backend still enforces admin)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // filters
  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [query, setQuery] = useState<string>(""); // company name search

  // data
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string>("");
  const [summary, setSummary] = useState<SummaryResp | null>(null);
  const [dailyCompanies, setDailyCompanies] = useState<DailyCompaniesRow[]>([]);
  const [jobsDaily, setJobsDaily] = useState<JobsDailyRow[]>([]);
  const [jobsByCompany, setJobsByCompany] = useState<JobsByCompanyRow[]>([]);

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""),
    []
  );
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function checkAdmin() {
    try {
      if (!token) { setIsAuthorized(false); return; }
      const res = await apiFetch("/reports/members", { headers });
      if (res.status === 401 || res.status === 403) { setIsAuthorized(false); return; }
      setIsAuthorized(true);
    } catch { setIsAuthorized(false); }
  }

  async function loadReports() {
    setLoading(true);
    setErrMsg("");
    try {
      const [sum, dc, jd, jbc] = await Promise.all([
        apiFetch(`/reports/companies/summary?from=${from}&to=${to}`, { headers }).then(r => r.json()),
        apiFetch(`/reports/companies/daily?from=${from}&to=${to}`, { headers }).then(r => r.json()),
        apiFetch(`/reports/companies/jobs-daily?from=${from}&to=${to}`, { headers }).then(r => r.json()),
        apiFetch(
          `/reports/companies/jobs-by-company?from=${from}&to=${to}${query ? `&q=${encodeURIComponent(query)}` : ""}`,
          { headers }
        ).then(r => r.json()),
      ]);
      setSummary(sum || null);
      setDailyCompanies(dc || []);
      setJobsDaily(jd || []);
      setJobsByCompany(jbc || []);
    } catch (e: any) {
      setErrMsg(e?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { checkAdmin(); }, []);
  useEffect(() => { if (isAuthorized) loadReports(); }, [isAuthorized, from, to]);

  if (isAuthorized === null) return <div className="p-6">Loading…</div>;
  if (isAuthorized === false)
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-700">Admins only</h1>
        <p className="text-gray-700 mt-2">Please log in as an admin to view company reports.</p>
      </div>
    );

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header + filters */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold text-blue-900">Company Reports</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm text-gray-600">From</label>
            <input type="date" className="border rounded px-2 py-1" value={from} onChange={(e)=>setFrom(e.target.value)} />
            <label className="text-sm text-gray-600">To</label>
            <input type="date" className="border rounded px-2 py-1" value={to} onChange={(e)=>setTo(e.target.value)} />
            <input
              type="text"
              placeholder="Search company…"
              className="border rounded px-2 py-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={loadReports} className="px-3 py-1 rounded bg-blue-900 text-white" disabled={loading}>
              {loading ? "Refreshing…" : "Apply"}
            </button>
          </div>
        </header>

        {errMsg && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">{errMsg}</div>
        )}

        {/* Summary bars */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-white">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Non-Admin Totals (Selected Range)</h2>
            <div className="grid grid-cols-3 gap-3">
              <SummaryStat label="Companies" value={summary?.non_admin.companies_created ?? 0} />
              <SummaryStat label="Paid Jobs" value={summary?.non_admin.paid_jobs ?? 0} />
              <SummaryStat label="Free Jobs" value={summary?.non_admin.free_jobs ?? 0} />
            </div>
          </div>
          <div className="p-4 rounded-lg border bg-white">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Admin Totals (Selected Range)</h2>
            <div className="grid grid-cols-3 gap-3">
              <SummaryStat label="Companies" value={summary?.admin.companies_created ?? 0} />
              <SummaryStat label="Paid Jobs" value={summary?.admin.paid_jobs ?? 0} />
              <SummaryStat label="Free Jobs" value={summary?.admin.free_jobs ?? 0} />
            </div>
          </div>
        </section>

        {/* NEW: All-time companies (ignores date filters) */}
        {summary?.all_time_companies && (
          <section className="p-4 rounded-lg border bg-emerald-50 border-emerald-200">
            <h2 className="text-sm font-semibold text-emerald-900 mb-1">All-Time Companies (ignores date)</h2>
            <p className="text-sm text-emerald-800">
              Admin: <b>{summary.all_time_companies.admin}</b> &nbsp;•&nbsp; Non-Admin:{" "}
              <b>{summary.all_time_companies.non_admin}</b> &nbsp;•&nbsp; Total:{" "}
              <b>{summary.all_time_companies.total}</b>
            </p>
          </section>
        )}

        {/* 1) Companies created per day */}
        <section className="p-4 rounded-lg border bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-900">Company Profiles Created (Daily)</h2>
            <div className="text-sm text-gray-600">
              {dailyCompanies.at(-1)?.companies ?? 0} today
            </div>
          </div>
          <div className="overflow-auto mt-3">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr><th className="py-2">Day</th><th className="py-2">Companies</th></tr>
              </thead>
              <tbody>
                {dailyCompanies.map((row) => (
                  <tr key={row.day} className="border-t">
                    <td className="py-2">{row.day}</td>
                    <td className="py-2">{row.companies}</td>
                  </tr>
                ))}
                {dailyCompanies.length === 0 && (
                  <tr><td className="py-3 text-gray-500" colSpan={2}>No data in selected range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2) Jobs daily */}
        <section className="p-4 rounded-lg border bg-white">
          <h2 className="text-lg font-semibold text-blue-900">Jobs Created (Daily)</h2>
          <div className="overflow-auto mt-3">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">Day</th>
                  <th className="py-2">Total</th>
                  <th className="py-2 text-emerald-700">Free</th>
                  <th className="py-2 text-blue-700">Paid</th>
                </tr>
              </thead>
              <tbody>
                {jobsDaily.map((row) => (
                  <tr key={row.day} className="border-t">
                    <td className="py-2">{row.day}</td>
                    <td className="py-2">{row.total_jobs}</td>
                    <td className="py-2">{row.free_jobs}</td>
                    <td className="py-2">{row.paid_jobs}</td>
                  </tr>
                ))}
                {jobsDaily.length === 0 && (
                  <tr><td className="py-3 text-gray-500" colSpan={4}>No data in selected range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3) Jobs by company (filtered by q) */}
        <section className="p-4 rounded-lg border bg-white">
          <h2 className="text-lg font-semibold text-blue-900">Jobs by Company (Selected Period)</h2>
          <div className="overflow-auto mt-3">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">Company</th>
                  <th className="py-2">Company ID</th>
                  <th className="py-2">Total</th>
                  <th className="py-2 text-emerald-700">Free</th>
                  <th className="py-2 text-blue-700">Paid</th>
                  <th className="py-2">First Posted</th>
                  <th className="py-2">Last Posted</th>
                  <th className="py-2">Free Jobs Used (lifetime)</th>
                </tr>
              </thead>
              <tbody>
                {jobsByCompany.map((row) => (
                  <tr key={row.company_id} className="border-t">
                    <td className="py-2">{row.company_name}</td>
                    <td className="py-2">{row.company_id}</td>
                    <td className="py-2 font-semibold">{row.total_jobs}</td>
                    <td className="py-2">{row.free_jobs}</td>
                    <td className="py-2">{row.paid_jobs}</td>
                    <td className="py-2">{row.first_job_posted_at ? new Date(row.first_job_posted_at).toLocaleString() : "-"}</td>
                    <td className="py-2">{row.last_job_posted_at ? new Date(row.last_job_posted_at).toLocaleString() : "-"}</td>
                    <td className="py-2">{row.free_jobs_used_total ?? 0}</td>
                  </tr>
                ))}
                {jobsByCompany.length === 0 && (
                  <tr><td className="py-3 text-gray-500" colSpan={8}>No companies found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 border rounded-lg bg-gray-50">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-blue-900">{value}</div>
    </div>
  );
}
