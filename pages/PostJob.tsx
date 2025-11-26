// pages/postjob.tsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient";

const PostJobPage = () => {
  const router = useRouter();
  const { companyId } = router.query; // Just for redirect/UI, backend doesn't need it

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState(""); // Remote / Onsite / Hybrid
  const [requirements, setRequirements] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [salary, setSalary] = useState("");
  const [jobType, setJobType] = useState(""); // e.g. Internship, Full-time, etc.
  const [country, setCountry] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [city, setCity] = useState("");
  const [planType, setPlanType] = useState("free"); // free | pay_per_post | subscription

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to post a job.");
      return;
    }

    // Basic validation to match backend required fields
    if (
      !title ||
      !description ||
      !category ||
      !jobType ||
      !applyUrl ||
      !location ||
      !country ||
      !stateValue ||
      !city ||
      !planType
    ) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiFetch("/companies/post-job", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          location,      // MUST be "Remote" | "Onsite" | "Hybrid"
          requirements,
          applyUrl,
          salary,
          jobType,
          country,
          state: stateValue,
          city,
          planType,      // "free" | "pay_per_post" | "subscription"
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // data.companyId is returned by backend
        alert("Job created successfully!");
        router.push(`/company/${data.companyId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create job.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Post a Job</h1>

      {companyId && (
        <p className="mb-2 text-sm text-gray-500">
          Posting job for company ID: {companyId}
        </p>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block font-medium">Job Title *</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Description *</label>
          <textarea
            className="w-full p-2 border border-gray-300"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Category *</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Job Type *</label>
          <input
            type="text"
            placeholder="Internship, Entry-Level, Full-time..."
            className="w-full p-2 border border-gray-300"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Location Type *</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            <option value="">Select...</option>
            <option value="Remote">Remote</option>
            <option value="Onsite">Onsite</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Country *</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">State *</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={stateValue}
            onChange={(e) => setStateValue(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">City *</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Apply URL *</label>
          <input
            type="url"
            className="w-full p-2 border border-gray-300"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Salary (optional)</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium">Requirements (optional)</label>
          <textarea
            className="w-full p-2 border border-gray-300"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium">Plan Type *</label>
          <select
            className="w-full p-2 border border-gray-300"
            value={planType}
            onChange={(e) => setPlanType(e.target.value)}
            required
          >
            <option value="free">Free</option>
            <option value="pay_per_post">Pay Per Post</option>
            <option value="subscription">Subscription</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`px-4 py-2 text-white rounded ${
            submitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"
          }`}
        >
          {submitting ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
};

export default PostJobPage;
