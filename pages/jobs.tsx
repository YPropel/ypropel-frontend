import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AuthGuard from "../components/AuthGuard"; // adjust path if needed
import { apiFetch } from "../apiClient";

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

const JOB_TYPES = [
  { label: "Internship", value: "internship" },
  { label: "Entry Level", value: "entry_level" },
  { label: "Hourly", value: "hourly" },
];

const LOCATION_OPTIONS = ["Remote", "Onsite", "Hybrid"];

function JobsPageContent() {
  const router = useRouter();
  const { type } = router.query;

  // Filters state
  const [country, setCountry] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  // State, country, city, category options
  const [states, setStates] = useState<{ name: string; abbreviation: string }[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  // Compute other job types for links (exclude current)
  const otherJobTypes = JOB_TYPES.filter((jt) => jt.value !== type);

  // 🔹 Helper: record interest when user applies from the list
  const recordInterest = async (jobId: number) => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await apiFetch(`/jobs/${jobId}/interest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to record job interest from list:", err);
    }
  };

  // Fetch job categories for filter drop down
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await apiFetch("/job-categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data.map((cat: { name: string }) => cat.name));
      } catch (error) {
        console.error("Failed to load job categories:", error);
        setCategories([]);
      }
    }
    fetchCategories();
  }, []);

  // Fetch countries on mount
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await apiFetch("/countries");
        if (!res.ok) throw new Error("Failed to fetch countries");
        const data = await res.json();
        setCountries(data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (!country) {
      setStates([]);
      setState("");
      return;
    }

    async function fetchStates() {
      try {
        const res = await apiFetch(`/us-states?country=${encodeURIComponent(country)}`);
        if (!res.ok) throw new Error("Failed to fetch states");
        const data = await res.json(); // Now expects array of {name, abbreviation}
        setStates(data);
      } catch (error) {
        console.error(error);
        setStates([]);
      }
    }
    fetchStates();
  }, [country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!state) {
      setCities([]);
      setCity("");
      return;
    }

    async function fetchCities() {
      try {
        const res = await apiFetch(`/us-cities?state=${encodeURIComponent(state)}`);
        if (!res.ok) throw new Error("Failed to fetch cities");
        const data = await res.json();
        setCities(data);
      } catch (error) {
        console.error(error);
        setCities([]);
      }
    }
    fetchCities();
  }, [state]);

  // Fetch jobs whenever filters or type change
  useEffect(() => {
    if (!type) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.append("job_type", type.toString());
    if (country) params.append("country", country);
    if (state) params.append("state", state);
    if (city) params.append("city", city);
    if (category) params.append("category", category);
    if (location) params.append("location", location);

    apiFetch(`/jobs?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch jobs");
        return res.json();
      })
      .then((data) => {
        setJobs(data);
        setLoading(false);
        setExpandedJobId(null);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [type, country, state, city, category, location]);

  const titleCase = (str: string) => {
    if (str === "internship") return "Internships";
    if (str === "entry_level") return "Entry-level Roles";
    if (str === "hourly") return "Hourly Roles";
    return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (!type) return <p className="p-4">Loading...</p>;
  if (loading) return <p className="p-4">Loading jobs...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{titleCase(type.toString())}</h1>

      {/* Other job type links */}
      <div className="mb-6 space-x-4">
        {otherJobTypes.map((jt) => {
          let label = "";
          if (jt.value === "internship") label = "Internships";
          else if (jt.value === "entry_level") label = "Entry-level Roles";
          else if (jt.value === "hourly") label = "Hourly Roles";

          return (
            <Link
              key={jt.value}
              href={`/jobs?type=${jt.value}`}
              className="inline-block px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          disabled={!country}
          className="border rounded px-3 py-2"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s.abbreviation} value={s.abbreviation}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={!state}
          className="border rounded px-3 py-2"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Location Types</option>
          {LOCATION_OPTIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setCountry("");
            setState("");
            setCity("");
            setCategory("");
            setLocation("");
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          title="Clear Filters"
        >
          Clear
        </button>
      </div>

      {/* Jobs list */}
      {jobs.length === 0 ? (
        <p>No jobs found for the selected filters.</p>
      ) : (
        <ul>
          {jobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            return (
              <li key={job.id} className="border rounded p-4 mb-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">
                      <Link href={`/jobs/${job.id}`} className="text-blue-900 hover:underline">
                        {job.title}
                      </Link>
                    </h2>
                    <p className="text-gray-700">
                      <strong>Company:</strong> {job.company}
                    </p>
                    <p className="text-gray-700">
                      <strong>Location:</strong> {job.location}
                    </p>
                    <p className="text-gray-700">
                      <strong>Salary:</strong> {job.salary || "—"}
                    </p>

                    <p className="text-gray-700">
                      <strong>Country:</strong> {job.country || "—"}
                    </p>
                    <p className="text-gray-700">
                      <strong>City:</strong> {job.city || "—"}
                    </p>
                    <p className="text-gray-700">
                      <strong>State:</strong> {job.state || "—"}
                    </p>

                    <p className="text-gray-500 text-sm">
                      Posted on {new Date(job.posted_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {isExpanded ? "Hide Details" : "View Details"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t pt-4 text-gray-700">
                    {job.description && (
                      <>
                        <h3 className="font-semibold mb-1">Description</h3>
                        <p className="whitespace-pre-line mb-3">{job.description}</p>
                      </>
                    )}

                    {job.requirements && (
                      <>
                        <h3 className="font-semibold mb-1">Requirements</h3>
                        <p className="whitespace-pre-line mb-3">{job.requirements}</p>
                      </>
                    )}

                    {job.apply_url && (
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          e.preventDefault();
                          await recordInterest(job.id); // 🔹 record interest from list view
                          window.open(job.apply_url!, "_blank", "noopener,noreferrer");
                        }}
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        Apply Now
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <AuthGuard>
      <JobsPageContent />
    </AuthGuard>
  );
}
