import React, { useState, useEffect } from "react";
import { apiFetch } from "../apiClient"; // Adjust path as needed

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
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("remote");
  const [requirements, setRequirements] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [salary, setSalary] = useState("");
  const [jobType, setJobType] = useState("entry_level");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Fetch companyId and jobs on mount
  useEffect(() => {
    const storedCompanyId = localStorage.getItem("companyId");
    const token = localStorage.getItem("token");

    if (!storedCompanyId) {
      setError("Company ID is required.");
      return;
    }

    if (!token) {
      setError("User is not logged in.");
      return;
    }

    setCompanyId(storedCompanyId);

    const fetchJobs = async () => {
      const response = await apiFetch(`/companies/${storedCompanyId}/jobs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const jobData = await response.json();
        setJobs(jobData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch jobs.");
      }
    };

    fetchJobs();
  }, []);

  // Fetch countries
  useEffect(() => {
    apiFetch("/countries")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCountries(data.map((country) => ({ name: country })));
        } else {
          console.error("Fetched countries is not an array:", data);
        }
      })
      .catch((err) => {
        console.error("Failed to load countries:", err);
        setError("Failed to load countries.");
      });
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (!country) return;

    if (country === "USA" || country === "United States") {
      apiFetch("/us-states")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setStates(data);
          } else {
            console.error("Fetched states is not an array:", data);
          }
        })
        .catch(() => setStates([]));
    } else {
      setStates([]);
      setState("");
      setCity("");
    }
  }, [country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!state || !(country === "USA" || country === "United States")) {
      setCities([]);
      setCity("");
      return;
    }

    apiFetch(`/us-cities?state=${encodeURIComponent(state)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCities(data.map((city) => ({ name: city })));
        } else {
          console.error("Fetched cities is not an array:", data);
        }
      })
      .catch(() => setCities([]));
  }, [state, country]);

  // Fetch jobs again after posting or deleting
  const refreshJobs = async () => {
    const token = localStorage.getItem("token");
    const storedCompanyId = localStorage.getItem("companyId");

    if (!storedCompanyId || !token) return;

    const response = await apiFetch(`/companies/${storedCompanyId}/jobs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const jobData = await response.json();
      setJobs(jobData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !location || !country || !state || !city || !applyUrl || !jobType) {
      setError("All required fields must be filled.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("User is not logged in.");
      return;
    }

    const formattedLocation = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();

    try {
      const response = await apiFetch("/companies/post-job", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          location: formattedLocation,
          requirements,
          applyUrl,
          salary,
          jobType,
          country,
          state,
          city,
          expiresAt,
          isActive,
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await refreshJobs();

        setTitle("");
        setDescription("");
        setCategory("");
        setLocation("remote");
        setRequirements("");
        setApplyUrl("");
        setSalary("");
        setJobType("entry_level");
        setCountry("");
        setState("");
        setCity("");
        setExpiresAt("");
        setIsActive(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to post job");
      }
    } catch (error) {
      setError("Something went wrong. Please try again later.");
    }
  };

  const handleDelete = async (jobId: string) => {
    const token = localStorage.getItem("token");

    try {
      const response = await apiFetch(`/companies/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await refreshJobs(); // Reload jobs list after deletion
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete job");
      }
    } catch (error) {
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold">Post a Job</h2>
      {error && <p className="text-red-500">{error}</p>}
      
      {/* Form code stays unchanged (already shared above) */}
      {/* Display Jobs */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold">Posted Jobs</h2>
        {jobs.length > 0 ? (
          <ul>
            {jobs.map((job) => (
              <li key={job.id} className="py-2">
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <p><strong>Description:</strong> {job.description}</p>
                <p><strong>Category:</strong> {job.category}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Job Type:</strong> {job.jobType}</p>
                <p><strong>Salary:</strong> {job.salary}</p>
                <p><strong>Requirements:</strong> {job.requirements}</p>
                <p><strong>Apply URL:</strong> <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">{job.applyUrl}</a></p>
                <p><strong>Expiration Date:</strong> {job.expiresAt}</p>
                <p><strong>Active:</strong> {job.isActive ? "Yes" : "No"}</p>

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
