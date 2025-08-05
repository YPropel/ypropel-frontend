import React, { useState, useEffect } from "react";
import { apiFetch } from "../apiClient"; // Adjust path as needed

const JOB_TYPES = [
  { label: "Internship", value: "internship" },
  { label: "Entry Level", value: "entry_level" },
  { label: "Hourly", value: "hourly" },
];

const LOCATION_OPTIONS = ["Remote", "Onsite", "Hybrid"];

type Country = {
  name: string;
};

type State = {
  name: string;
  abbreviation: string;
};

type City = {
  name: string;
};

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
  const [jobs, setJobs] = useState<any[]>([]); // Store jobs

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Fetch companyId from localStorage after the component mounts
  useEffect(() => {
    const storedCompanyId = localStorage.getItem("companyId");
    if (storedCompanyId) {
      setCompanyId(storedCompanyId); // Set companyId in state
    } else {
      setError("Company ID is required.");
    }
  }, []); // This will only run once when the component mounts

  // Fetch jobs based on companyId after companyId is set
  useEffect(() => {
    if (!companyId) return;

    const fetchJobs = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("User is not logged in.");
        return;
      }

      const response = await apiFetch(`/companies/${companyId}/jobs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const jobData = await response.json();
        setJobs(jobData); // Update jobs state
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch jobs.");
      }
    };

    fetchJobs();
  }, [companyId]); // Re-run effect when companyId changes

  // Fetch countries once
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

  // Fetch states when country changes (only if USA)
  useEffect(() => {
    if (!country) return;

    if (country === "USA" || country === "United States") {
      apiFetch("/us-states")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setStates(data); // Use the fetched states
          } else {
            console.error("Fetched states is not an array:", data);
          }
        })
        .catch(() => setStates([]));
    } else {
      setStates([]);
      setState(""); // Reset state when country is not USA
      setCity(""); // Reset city when country is not USA
    }
  }, [country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!state || !(country === "USA" || country === "United States")) {
      setCities([]);
      setCity(""); // Reset city when state is empty
      return;
    }

    apiFetch(`/us-cities?state=${encodeURIComponent(state)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCities(data.map((city) => ({ name: city }))); // Map cities to city objects
        } else {
          console.error("Fetched cities is not an array:", data);
        }
      })
      .catch(() => setCities([]));
  }, [state, country]);
//----------HAndle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !location || !country || !state || !city) {
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
        const responseData = await response.json();
        setJobs((prevJobs) => [...prevJobs, responseData]); // Add the newly created job to the list

        // Clear form fields
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
        setJobs(jobs.filter((job) => job.id !== jobId)); // Remove deleted job from the state
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
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Location (Dropdown for remote, onsite, hybrid) */}
        <div>
          <label className="block">Location</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Country (Dropdown) */}
        <div>
          <label className="block">Country</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          >
            <option value="">Select a country</option>
            {countries.map((country) => (
              <option key={country.name} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* State (Dropdown) */}
        <div>
          <label className="block">State</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          >
            <option value="">Select a state</option>
            {states.map((state) => (
              <option key={state.abbreviation} value={state.abbreviation}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {/* City (Dropdown) */}
        <div>
          <label className="block">City</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          >
            <option value="">Select a city</option>
            {cities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
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
            <option value="internship">Internship</option>
            <option value="entry_level">Entry Level</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>

        {/* Expiration Date */}
        <div>
          <label className="block">Expiration Date</label>
          <input
            type="date"
            className="w-full p-2 border border-gray-300"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        {/* Active Status */}
        <div>
          <label className="block">Active</label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={() => setIsActive(!isActive)}
          />
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

          {/* Delete Button */}
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
