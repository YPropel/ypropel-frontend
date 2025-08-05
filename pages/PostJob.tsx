import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient"; // Adjust the import path as needed

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("remote");
  const [requirements, setRequirements] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [salary, setSalary] = useState("");
  const [jobType, setJobType] = useState("entry_level");
  const [country, setCountry] = useState(""); // Country dropdown
  const [state, setState] = useState(""); // State abbreviation
  const [city, setCity] = useState(""); // City dropdown
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { companyId } = router.query;

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Fetch countries once
  useEffect(() => {
    apiFetch("/countries")
      .then((res) => res.json())
      .then((data) => {
        setCountries(data);
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
          setStates(data);
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
        setCities(data);
      })
      .catch(() => setCities([]));
  }, [state, country]);

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

    try {
      const response = await apiFetch("/companies/post-job", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          location,
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
        router.push(`/companies/jobs?companyId=${companyId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to post job");
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
    </div>
  );
};

export default PostJob;
