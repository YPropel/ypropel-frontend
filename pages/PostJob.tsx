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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { companyId } = router.query; // Get companyId from the URL

  const [companyName, setCompanyName] = useState("");  // To store the company name

  useEffect(() => {
    if (!companyId) return; // Ensure companyId is available

    const token = localStorage.getItem("token");
    if (!token) {
      setError("User is not logged in.");
      return;
    }

    const fetchCompanyName = async () => {
      try {
        const response = await apiFetch(`/companies/${companyId}`, {
         
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
        {/* Form fields for job posting */}
        {/* Example for title */}
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
        {/* Repeat for other fields like description, category, etc. */}

        <button type="submit" className="px-4 py-2 bg-blue-500 text-white">
          Post Job
        </button>
      </form>
    </div>
  );
};

export default PostJob;
