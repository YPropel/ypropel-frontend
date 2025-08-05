import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient"; 

type Job = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  company?: string;
  location?: string;
  requirements?: string;
  apply_url?: string;
  salary?: string;
  is_active?: boolean;
  expires_at?: string;
  job_type?: string;
  country?: string;
  state?: string;
  city?: string;
};

type Category = {
  id: number;
  name: string;
};

const JOB_TYPES = [
  { label: "Internship", value: "internship" },
  { label: "Entry Level", value: "entry_level" },
  { label: "Hourly", value: "hourly" },
];

export default function PostJobPage() {
  // States to hold form data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>(undefined);

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showDeleteList, setShowDeleteList] = useState(false);

  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<{ name: string; abbreviation: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [formData, setFormData] = useState<Partial<Job>>({
    title: "",
    description: "",
    category: "",
    company: "",
    location: "",
    requirements: "",
    apply_url: "",
    salary: "",
    is_active: true,
    expires_at: "",
    job_type: "entry_level",
    country: "",
    state: "",
    city: "",
  });

  const LOCATION_OPTIONS = ["Remote", "Onsite", "Hybrid"];

  // Only fetch jobs if authorized
  useEffect(() => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    async function fetchJobs() {
      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch("/admin/jobs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch jobs");
        }

        const data = await res.json();
        setJobs(data);
      } catch (err: any) {
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [token, refreshFlag]);

  // Only fetch categories if authorized
  useEffect(() => {
    if (!token) return;

    apiFetch("/admin/job-categories", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`);
        return res.json();
      })
      .then(setCategories)
      .catch((err) => console.error("Category fetch error:", err));
  }, [token, refreshFlag]);

  // Fetch countries once
  useEffect(() => {
    apiFetch("/countries")
      .then((res) => res.json())
      .then(setCountries)
      .catch(console.error);
  }, []);

  // Fetch states when country changes (only if USA)
  useEffect(() => {
    if (!formData.country) return;

    if (formData.country === "USA" || formData.country === "United States") {
      apiFetch("/us-states")
        .then((res) => res.json())
        .then((data) => {
          setStates(data);
        })
        .catch(() => setStates([]));
    } else {
      setStates([]);
      setFormData((prev) => ({ ...prev, state: "", city: "" }));
    }
  }, [formData.country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!formData.state || !(formData.country === "USA" || formData.country === "United States")) {
      setCities([]);
      setFormData((prev) => ({ ...prev, city: "" }));
      return;
    }

    apiFetch(`/us-cities?state=${encodeURIComponent(formData.state)}`)
      .then((res) => res.json())
      .then(setCities)
      .catch(() => setCities([]));
  }, [formData.state, formData.country]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" && "checked" in e.target ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      alert("Not authenticated");
      return;
    }

    if (!formData.title?.trim()) {
      alert("Title is required");
      return;
    }

    if (!formData.job_type) {
      alert("Job Type is required");
      return;
    }

    if (!formData.category) {
      alert("Category is required");
      return;
    }

    if (!formData.apply_url || formData.apply_url.trim() === "") {
      alert("Apply URL is required");
      return;
    }

    try {
      const method = selectedJob ? "PUT" : "POST";
      const url = selectedJob ? `/admin/jobs/${selectedJob.id}` : "/admin/jobs";

      const res = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save job");
      }

      alert("Job saved successfully!");
      setSelectedJob(undefined);
      setRefreshFlag((f) => !f);
    } catch (err: any) {
      alert(err.message || "Error saving job");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this job?")) return;
    if (!token) {
      alert("Not authenticated");
      return;
    }

    try {
      const res = await apiFetch(`/admin/jobs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete job");
      }

      setRefreshFlag((f) => !f);
      if (selectedJob?.id === id) setSelectedJob(undefined);
    } catch (err: any) {
      alert(err.message || "Error deleting job");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Job Management</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Job Form */}
      <h2 className="text-2xl font-semibold mb-4">{selectedJob ? "Edit Job Posting" : "Create New Job Posting"}</h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mb-8">
        {/* Job Type */}
        <div>
          <label htmlFor="job_type" className="block font-semibold mb-1">
            Job Type <span className="text-red-600">*</span>
          </label>
          <select
            id="job_type"
            name="job_type"
            value={formData.job_type || ""}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Job Type</option>
            {JOB_TYPES.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {/* Company Name */}
        <div>
          <label htmlFor="company" className="block font-semibold mb-1">
            Company Name <span className="text-red-600">*</span>
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={formData.company || ""}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block font-semibold mb-1">
            Category <span className="text-red-600">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category || ""}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block font-semibold mb-1">
            Country
          </label>
          <select
            id="country"
            name="country"
            value={formData.country || ""}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block font-semibold mb-1">
            State
          </label>
          <select
            id="state"
            name="state"
            value={formData.state || ""}
            onChange={handleChange}
            disabled={!formData.country || formData.country !== "USA"}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block font-semibold mb-1">
            City
          </label>
          <select
            id="city"
            name="city"
            value={formData.city || ""}
            onChange={handleChange}
            disabled={!formData.state || formData.state === ""}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Job Location */}
        <div>
          <label htmlFor="location" className="block font-semibold mb-1">
            Job Location
          </label>
          <select
            id="location"
            name="location"
            value={formData.location || ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Location</option>
            {LOCATION_OPTIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Apply URL */}
        <div>
          <label htmlFor="apply_url" className="block font-semibold mb-1">
            Apply URL <span className="text-red-600">*</span>
          </label>
          <input
            id="apply_url"
            name="apply_url"
            type="url"
            value={formData.apply_url || ""}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          {selectedJob ? "Update Job" : "Create Job"}
        </button>
      </form>
    </div>
  );
}
