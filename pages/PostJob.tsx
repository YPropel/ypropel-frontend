import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient"; // Adjust path if necessary

const JOB_TYPES = [
  { label: "Internship", value: "internship" },
  { label: "Entry Level", value: "entry_level" },
  { label: "Hourly", value: "hourly" },
];

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [requirements, setRequirements] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [salary, setSalary] = useState("");
  const [jobType, setJobType] = useState("entry_level");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [companyName, setCompanyName] = useState("");  // To store the company name
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { companyId } = router.query; // Get companyId from the URL

  // Fetch the company name associated with the logged-in user
  useEffect(() => {
    if (!companyId) return; // Ensure companyId is available

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not logged in.");
      return;
    }

    const fetchCompanyName = async () => {
      try {
        const response = await apiFetch(`/companies/${companyId}`, {  // Correct route to get company info
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCompanyName(data.name);  // Assuming the response contains company name
        } else {
          setError("Failed to fetch company information.");
        }
      } catch (error) {
        setError("Something went wrong. Please try again later.");
      }
    };

    fetchCompanyName();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !location || !salary || !jobType || !applyUrl || !country || !state || !city) {
      setError("All fields are required.");
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
          companyName,  // Sending the company name to the backend
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.push(`/companies/jobs`);
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
        {/* Title */}
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
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
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
            required
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
            <option value="">Select Job Type</option>
            {JOB_TYPES.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block">Country</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />
        </div>

        {/* State */}
        <div>
          <label className="block">State</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          />
        </div>

        {/* City */}
        <div>
          <label className="block">City</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
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

        <button type="submit" className="px-4 py-2 bg-blue-500 text-white">
          Post Job
        </button>
      </form>
    </div>
  );
};

export default PostJob;
