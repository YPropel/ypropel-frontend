import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "../../apiClient"; 

export default function AdminJobFairs() {
  const [jobFairs, setJobFairs] = useState<any[]>([]);
  type StateType = { name: string; abbreviation: string };
  const [states, setStates] = useState<StateType[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [newJobFair, setNewJobFair] = useState({
    title: "",
    description: "",
    website: "",
    cover_photo_url: "",
    location_state: "",
    location_city: "",
    start_datetime: "",
  });

  // ----------- CHANGED: Helper to get token or redirect -----------
  function getTokenOrRedirect() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ You must be logged in.");
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/admin/login"; // adjust path if needed
      }, 1500);
      return null;
    }
    return token;
  }

  const fetchStates = async () => {
    const res = await apiFetch("/us-states");
    const data = await res.json();
    setStates(data);
  };

  const fetchCities = async (state: string) => {
    const res = await apiFetch(`/us-cities?state=${encodeURIComponent(state)}`);
    const data = await res.json();
    setCities(data);
  };

  const fetchJobFairs = async () => {
    const res = await apiFetch("/job-fairs");
    const data = await res.json();
    setJobFairs(data);
  };

  useEffect(() => {
    fetchStates();
    fetchJobFairs();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState);
    }
  }, [selectedState]);

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ypropel_preset");

    const res = await fetch("https://api.cloudinary.com/v1_1/denggbgma/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.secure_url) {
      setNewJobFair((prev) => ({ ...prev, cover_photo_url: data.secure_url }));
    }
  };

  // ----------- CHANGED: Use getTokenOrRedirect and handle auth errors in handleAdd -----------
  const handleAdd = async () => {
    const token = getTokenOrRedirect();
    if (!token) return;

    const {
      title,
      description,
      website,
      cover_photo_url,
      location_state,
      location_city,
      start_datetime,
    } = newJobFair;

    const location = `${location_state} - ${location_city}`;

    // Validate required fields
    if (
      !title.trim() ||
      !description.trim() ||
      !website.trim() ||
      !cover_photo_url.trim() ||
      !location_state ||
      !location_city ||
      !start_datetime
    ) {
      alert("Please fill in all required fields before submitting.");
      return;
    }

    // Validate website format
    try {
      new URL(website);
    } catch (err) {
      alert("Please enter a valid website URL (e.g. https://example.com)");
      return;
    }

    const payload = {
      ...newJobFair,
      location,
    };

    const res = await apiFetch("/admin/job-fairs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // ----------- CHANGED: Auth error handling -----------
    if (res.status === 401 || res.status === 403) {
      alert("❌ Unauthorized. Redirecting to login...");
      localStorage.removeItem("token");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
      return;
    }

    if (!res.ok) {
      alert("Failed to add job fair.");
      return;
    }

    setNewJobFair({
      title: "",
      description: "",
      website: "",
      cover_photo_url: "",
      location_state: "",
      location_city: "",
      start_datetime: "",
    });
    setSelectedState("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchJobFairs();
  };

  // ----------- CHANGED: Use getTokenOrRedirect and auth error handling in handleDelete -----------
  const handleDelete = async (id: number) => {
    const token = getTokenOrRedirect();
    if (!token) return;

    const res = await apiFetch(`/admin/job-fairs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      alert("❌ Unauthorized. Redirecting to login...");
      localStorage.removeItem("token");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
      return;
    }

    if (res.ok) {
      setJobFairs((prev) => prev.filter((j) => j.id !== id));
    } else {
      alert("Failed to delete.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin: Job Fairs</h1>

      {/* Add Form */}
      <div className="space-y-4 mb-6 border p-4 rounded">
        <input
          type="text"
          placeholder="Title"
          value={newJobFair.title}
          onChange={(e) => setNewJobFair({ ...newJobFair, title: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="Description"
          value={newJobFair.description}
          onChange={(e) => setNewJobFair({ ...newJobFair, description: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="url"
          placeholder="Event Website"
          value={newJobFair.website}
          onChange={(e) => setNewJobFair({ ...newJobFair, website: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="datetime-local"
          value={newJobFair.start_datetime}
          onChange={(e) => setNewJobFair({ ...newJobFair, start_datetime: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <div className="flex gap-2">
          <select
            value={newJobFair.location_state}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setNewJobFair((prev) => ({ ...prev, location_state: e.target.value, location_city: "" }));
            }}
            className="border p-2 rounded w-1/2"
          >
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s.abbreviation} value={s.abbreviation}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={newJobFair.location_city}
            onChange={(e) => setNewJobFair((prev) => ({ ...prev, location_city: e.target.value }))}
            className="border p-2 rounded w-1/2"
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          className="w-full"
        />
        {newJobFair.cover_photo_url && (
          <img src={newJobFair.cover_photo_url} alt="Preview" className="w-40 mt-2 rounded" />
        )}
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Job Fair
        </button>
      </div>

      {/* List */}
      <div>
        <h2 className="text-xl font-semibold mb-2">All Job Fairs</h2>
        {jobFairs.length === 0 ? (
          <p>No job fairs yet.</p>
        ) : (
          <ul className="space-y-4">
            {jobFairs.map((job) => (
              <li key={job.id} className="border p-4 rounded space-y-1 bg-white shadow">
                <p><strong>Title:</strong> {job.title}</p>
                <p><strong>Description:</strong> {job.description}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Start:</strong> {job.start_datetime}</p>
                <p>
                  <strong>Website:</strong>{" "}
                  <a href={job.website} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    Visit
                  </a>
                </p>
                {job.cover_photo_url && (
                  <img src={job.cover_photo_url} alt="Job Fair" className="w-40 rounded" />
                )}
                <button
                  onClick={() => handleDelete(job.id)}
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
