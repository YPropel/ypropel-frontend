/* pages/jobs/[id].tsx */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import AuthGuard from "../../components/AuthGuard"; // adjust path if needed
import { apiFetch } from "../../apiClient";         // adjust path if needed

type Job = {
  id: number;
  title: string;
  salary?: string | null;
  company: string;
  location: string;
  posted_at: string;
  description?: string;
  requirements?: string;
  apply_url?: string;
  country?: string;
  state?: string;
  city?: string;
  category?: string;
};

function JobDetailsInner() {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiFetch(`/jobs/${id}`);
        if (!res.ok) throw new Error("Failed to fetch job");
        const data = await res.json();
        setJob(data);
      } catch (e) {
        console.error(e);
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // 🔹 Helper to record interest on this job
  const recordInterest = async () => {
    if (!job) return;
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) return; // AuthGuard should prevent this anyway

    try {
      await apiFetch(`/jobs/${job.id}/interest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to record job interest:", err);
    }
  };

  // 🔹 External apply: record interest then open new tab
  const handleExternalApply = async (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault();
    await recordInterest();
    if (job?.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer");
    }
  };

  // 🔹 Internal apply: record interest then router.push
  const handleInternalApply = async (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault();
    await recordInterest();
    if (job) {
      router.push(`/apply?jobId=${job.id}`);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Loading job…
      </div>
    );
  if (!job)
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Job not found.
      </div>
    );

  return (
    <>
      <Head>
        <title>{`${job.title}${job.company ? " — " + job.company : ""} | YPropel`}</title>
        <meta
          name="description"
          content={`Apply for ${job.title}${job.company ? " at " + job.company : ""} on YPropel`}
        />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-6">
            <Link href="/jobs" className="text-sm text-blue-700 hover:underline">
              ← Back to jobs
            </Link>
          </div>

          <header className="bg-white border rounded-xl p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-blue-900">{job.title}</h1>
            <div className="mt-2 text-gray-700 space-x-3">
              {job.company && <span className="font-medium">{job.company}</span>}
              {job.location && <span>{job.location}</span>}
              {job.salary && <span>• {job.salary}</span>}
              {(job.city || job.state || job.country) && (
                <span>
                  • {[job.city, job.state, job.country].filter(Boolean).join(", ")}
                </span>
              )}
              {job.category && <span>• {job.category}</span>}
              {job.posted_at && (
                <span className="text-gray-500 text-sm">
                  • Posted {new Date(job.posted_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {job.apply_url ? (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleExternalApply} // 🔹 record interest + open new tab
                  className="inline-flex items-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3"
                >
                  Apply Now
                </a>
              ) : (
                <a
                  href={`/apply?jobId=${job.id}`}
                  onClick={handleInternalApply} // 🔹 record interest + navigate
                  className="inline-flex items-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-3"
                >
                  Apply Now
                </a>
              )}
            </div>
          </header>

          <section className="mt-6 bg-white border rounded-xl p-6 shadow-sm space-y-6">
            {job.description && (
              <div>
                <h2 className="font-semibold text-blue-900 mb-2">Description</h2>
                <p className="whitespace-pre-line text-gray-800">{job.description}</p>
              </div>
            )}
            {job.requirements && (
              <div>
                <h2 className="font-semibold text-blue-900 mb-2">Requirements</h2>
                <p className="whitespace-pre-line text-gray-800">{job.requirements}</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export default function JobDetailsPage() {
  return (
    <AuthGuard>
      <JobDetailsInner />
    </AuthGuard>
  );
}
