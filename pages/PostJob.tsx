import React, { useState, useEffect } from "react";
import { apiFetch } from "../apiClient";
import { useRouter } from "next/router";

const JOB_TYPES = [
  { label: "Internship", value: "internship" },
  { label: "Entry Level", value: "entry_level" },
  { label: "Hourly", value: "hourly" },
];

const LOCATION_OPTIONS = ["Remote", "Onsite", "Hybrid"];

type Country = { name: string };
type State = { name: string; abbreviation: string };
type City = { name: string };

const PostJob = () => {
  const router = useRouter();

  const [companyId, setCompanyId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Remote"); // match allowed values
  const [requirements, setRequirements] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [salary, setSalary] = useState("");
  const [jobType, setJobType] = useState("entry_level");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [planType, setPlanType] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // pick companyId from URL first, then localStorage
  useEffect(() => {
    // URL query (e.g. /PostJob?companyId=123)
    const qId = router.query.companyId;
    if (typeof qId === "string" && qId.trim()) {
      setCompanyId(qId);
      localStorage.setItem("companyId", qId); // keep it handy for later
      return;
    }

    // fallback to localStorage
    const storedCompanyId = localStorage.getItem("companyId");
    if (storedCompanyId) {
      setCompanyId(storedCompanyId);
    } else {
      setError("Company ID is required. Please navigate from your company page.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.companyId]);

  // redirect if subscription selected
  useEffect(() => {
    if (planType === "subscription") {
      router.push("/subscription");
    }
  }, [planType, router]);

  // Fetch jobs for the company
  useEffect(() => {
    const fetchJobs = async () => {
      if (!companyId) return;
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not logged in.");
        return;
      }
      try {
        const response = await apiFetch(`/companies/${companyId}/jobs`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const jobData = await response.json();
          setJobs(Array.isArray(jobData) ? jobData : []);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch jobs.");
        }
      } catch {
        setError("Failed to fetch jobs. Please try again later.");
      }
    };

    fetchJobs();
  }, [companyId]);

  // Countries
  useEffect(() => {
    apiFetch("/countries")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCountries(data.map((c: any) => ({ name: typeof c === "string" ? c : c?.name })));
        }
      })
      .catch(() => setError("Failed to load countries."));
  }, []);

  // States (US only)
  useEffect(() => {
    if (!country) return;
    if (country === "USA" || country === "United States") {
      apiFetch("/us-states")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setStates(data);
        })
        .catch(() => setStates([]));
    } else {
      setStates([]);
      setState("");
      setCity("");
    }
  }, [country]);

  // Cities (when US state chosen)
  useEffect(() => {
    if (!state || !(country === "USA" || country === "United States")) {
      setCities([]);
      setCity("");
      return;
    }
    apiFetch(`/us-cities?state=${encodeURIComponent(state)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCities(data.map((n: string) => ({ name: n })));
      })
      .catch(() => setCities([]));
  }, [state, country]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  const token = localStorage.getItem("token");
  if (!token) {
    setError("User is not logged in.");
    return;
  }

  if (
    !title ||
    !description ||
    !category ||
    !location ||
    !country ||
    !state ||
    !city ||
    !applyUrl ||
    !jobType ||
    !planType
  ) {
    setError("All required fields must be filled.");
    return;
  }

  // subscription plan handled earlier by redirect effect, but keep guard
  if (planType === "subscription") {
    router.push("/subscription");
    return;
  }

  const jobData = {
    title,
    description,
    category,
    location, // already one of Remote/Onsite/Hybrid
    requirements,
    applyUrl,
    salary,
    jobType,
    country,
    state,
    city,
    planType,
  };

  // ✅ Pay per post: go to Stripe checkout, DON'T expect job back
  if (planType === "pay_per_post") {
    try {
      // Store job data temporarily so you can use it after payment success
      sessionStorage.setItem("pendingJobPost", JSON.stringify(jobData));

      const response = await apiFetch("/payment/create-checkout-session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          // Redirect to Stripe checkout
          window.location.href = url;
          return;
        } else {
          setError("Failed to start payment session.");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to start pay-per-post checkout.");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    }

    return;
  }

  // ✅ Free post
  try {
    const response = await apiFetch("/companies/post-job", {
      method: "POST",
      body: JSON.stringify(jobData),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const responseData = await response.json();

      // Prefer companyId returned from backend if present
      const cid = String(responseData.companyId || companyId || "");
      if (cid) {
        setCompanyId(cid);
        localStorage.setItem("companyId", cid);

        // refresh jobs list
        const refreshed = await apiFetch(`/companies/${cid}/jobs`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (refreshed.ok) {
          const updated = await refreshed.json();
          setJobs(Array.isArray(updated) ? updated : []);
        }
      }

      // reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setLocation("Remote");
      setRequirements("");
      setApplyUrl("");
      setSalary("");
      setJobType("entry_level");
      setCountry("");
      setState("");
      setCity("");
      setPlanType("");
    } else {
      const errorData = await response.json();
      setError(errorData.error || "Failed to post job");
    }
  } catch {
    setError("Something went wrong. Please try again later.");
  }
};

  const handleDelete = async (jobId: string | number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not logged in.");
      return;
    }
    try {
      const response = await apiFetch(`/companies/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setJobs((cur) => cur.filter((j) => String(j.id) !== String(jobId)));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete job");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold">Post a Job</h2>
      {error && <p className="text-red-500 mt-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Job Title */}
        <div>
          <label className="block">Job Title</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block">Description</label>
          <textarea
            className="w-full p-2 border border-gray-300"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block">Category</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block">Location</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            {LOCATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block">Country</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block">State</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          >
            <option value="">Select a state</option>
            {states.map((s) => (
              <option key={s.abbreviation} value={s.abbreviation}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block">City</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          >
            <option value="">Select a city</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Requirements */}
        <div>
          <label className="block">Requirements</label>
          <textarea
            className="w-full p-2 border border-gray-300"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
        </div>

        {/* Apply URL */}
        <div>
          <label className="block">Apply URL</label>
          <input
            type="url"
            className="w-full p-2 border border-gray-300"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            required
          />
        </div>

        {/* Salary */}
        <div>
          <label className="block">Salary</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>

        {/* Job Type */}
        <div>
          <label className="block">Job Type</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            required
          >
            {JOB_TYPES.map((jt) => (
              <option key={jt.value} value={jt.value}>
                {jt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Plan Type */}
        <div>
          <label className="block">Job Plan</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={planType}
            onChange={(e) => setPlanType(e.target.value)}
            required
          >
            <option value="">Select a Plan</option>
            <option value="free">Free Basic Post</option>
            <option value="pay_per_post">Pay-Per-Post ($75 for 30 days)</option>
            <option value="subscription">Monthly Subscription unlimited ($300)</option>
          </select>
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-500 text-white">
          Post Job
        </button>
      </form>

      {/* Display Jobs */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold">Posted Jobs</h2>
        {jobs.length > 0 ? (
          <ul>
            {jobs.map((job) => (
              <li key={job.id} className="py-2 border-b">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <p><strong>Description:</strong> {job.description}</p>
                <p><strong>Category:</strong> {job.category}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Job Type:</strong> {job.job_type}</p>
                <p><strong>Salary:</strong> {job.salary}</p>
                <p><strong>Requirements:</strong> {job.requirements}</p>
                <p>
                  <strong>Apply URL:</strong>{" "}
                  <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                    {job.apply_url}
                  </a>
                </p>
                <p><strong>Expiration Date:</strong> {job.expires_at ? new Date(job.expires_at).toLocaleString() : "-"}</p>
                <p><strong>Active:</strong> {job.is_active ? "Yes" : "No"}</p>

                <button
                  onClick={() => handleDelete(job.id)}
                  className="bg-red-500 text-white py-1 px-3 rounded mt-2"
                >
                  Delete Job
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No jobs available for this company.</p>
        )}
      </div>
    </div>
  );
};

export default PostJob;
