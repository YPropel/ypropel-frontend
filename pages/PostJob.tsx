import React, { useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient"; // Adjust path as needed

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
  const { companyId } = router.query; // We don't need to pass companyId in the request anymore

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
        const responseData = await response.json();
        // Redirect to jobs page with companyId received from the backend
        router.push(`/companies/jobs?companyId=${responseData.companyId}`);
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
            {["Remote", "Onsite", "Hybrid"].map((option) => (
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
            {/* Add your countries here */}
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
            {/* Add your states here */}
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
            {/* Add your cities here */}
          </select>
        </div>

        {/* Other fields */}
        {/* You can add other form fields here similar to the above */}
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white">
          Post Job
        </button>
      </form>
    </div>
  );
};

export default PostJob;
