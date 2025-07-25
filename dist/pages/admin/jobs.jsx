"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminJobsPage;
const react_1 = __importStar(require("react"));
const JOB_TYPES = [
    { label: "Internship", value: "internship" },
    { label: "Entry Level", value: "entry_level" },
    { label: "Hourly", value: "hourly" },
];
function AdminJobsPage() {
    const [jobs, setJobs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [selectedJob, setSelectedJob] = (0, react_1.useState)(undefined);
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [newCategoryName, setNewCategoryName] = (0, react_1.useState)("");
    const [refreshFlag, setRefreshFlag] = (0, react_1.useState)(false);
    const [showDeleteList, setShowDeleteList] = (0, react_1.useState)(false);
    const [countries, setCountries] = (0, react_1.useState)([]);
    const [states, setStates] = (0, react_1.useState)([]);
    const [cities, setCities] = (0, react_1.useState)([]);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const [formData, setFormData] = (0, react_1.useState)({
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
    // Fetch jobs list
    (0, react_1.useEffect)(() => {
        if (!token) {
            setError("Not authenticated");
            return;
        }
        async function fetchJobs() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("http://localhost:4000/admin/jobs", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to fetch jobs");
                }
                const data = await res.json();
                setJobs(data);
            }
            catch (err) {
                setError(err.message || "Unexpected error");
            }
            finally {
                setLoading(false);
            }
        }
        fetchJobs();
    }, [token, refreshFlag]);
    // Fetch categories list
    (0, react_1.useEffect)(() => {
        if (!token)
            return;
        fetch("http://localhost:4000/admin/job-categories", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
            if (!res.ok)
                throw new Error(`Failed to fetch categories: ${res.statusText}`);
            return res.json();
        })
            .then(setCategories)
            .catch((err) => console.error("Category fetch error:", err));
    }, [token, refreshFlag]);
    // Fetch countries once
    (0, react_1.useEffect)(() => {
        fetch("http://localhost:4000/countries")
            .then((res) => res.json())
            .then(setCountries)
            .catch(console.error);
    }, []);
    // Fetch states when country changes (only if USA)
    (0, react_1.useEffect)(() => {
        if (formData.country !== "USA") {
            setStates([]);
            setFormData((prev) => ({ ...prev, state: "", city: "" }));
            return;
        }
        fetch("http://localhost:4000/us-states")
            .then((res) => res.json())
            .then(setStates)
            .catch(() => setStates([]));
    }, [formData.country]);
    // Fetch cities when state changes
    (0, react_1.useEffect)(() => {
        if (!formData.state) {
            setCities([]);
            setFormData((prev) => ({ ...prev, city: "" }));
            return;
        }
        fetch(`http://localhost:4000/us-cities?state=${encodeURIComponent(formData.state)}`)
            .then((res) => res.json())
            .then(setCities)
            .catch(() => setCities([]));
    }, [formData.state]);
    // Load selected job data into form
    (0, react_1.useEffect)(() => {
        if (selectedJob) {
            setFormData({ ...selectedJob });
        }
        else {
            setFormData({
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
            setStates([]);
            setCities([]);
        }
    }, [selectedJob]);
    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        const val = type === "checkbox" ? checked : value;
        setFormData((prev) => ({
            ...prev,
            [name]: val,
        }));
    }
    async function handleSubmit(e) {
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
            const url = selectedJob
                ? `http://localhost:4000/admin/jobs/${selectedJob.id}`
                : "http://localhost:4000/admin/jobs";
            const res = await fetch(url, {
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
        }
        catch (err) {
            alert(err.message || "Error saving job");
        }
    }
    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this job?"))
            return;
        if (!token) {
            alert("Not authenticated");
            return;
        }
        try {
            const res = await fetch(`http://localhost:4000/admin/jobs/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete job");
            }
            setRefreshFlag((f) => !f);
            if (selectedJob?.id === id)
                setSelectedJob(undefined);
        }
        catch (err) {
            alert(err.message || "Error deleting job");
        }
    }
    return (<div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Job Management</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Job Form */}
      <h2 className="text-2xl font-semibold mb-4">{selectedJob ? "Edit Job Posting" : "Create New Job Posting"}</h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mb-8">
        {/* Job Type */}
        <div>
          <label htmlFor="job_type" className="block font-semibold mb-1">
            Job Type <span className="text-red-600">*</span>
          </label>
          <select id="job_type" name="job_type" value={formData.job_type || ""} onChange={handleChange} required className="w-full border rounded px-3 py-2">
            <option value="">Select Job Type</option>
            {JOB_TYPES.map(({ label, value }) => (<option key={value} value={value}>
                {label}
              </option>))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block font-semibold mb-1">
            Category <span className="text-red-600">*</span>
          </label>
          <select id="category" name="category" value={formData.category || ""} onChange={handleChange} required className="w-full border rounded px-3 py-2">
            <option value="">Select Category</option>
            {categories.map((cat) => (<option key={cat.id} value={cat.name}>
                {cat.name}
              </option>))}
          </select>

         

          {/* Add new category */}
          <div className="mt-4 flex gap-2 items-center">
            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name - add new cateogy to jobs category list if needed" className="border rounded px-3 py-1 flex-grow"/>
            <button type="button" onClick={async () => {
            if (!newCategoryName.trim())
                return alert("Category name required");
            try {
                const res = await fetch("http://localhost:4000/admin/job-categories", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name: newCategoryName.trim() }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to add category");
                }
                setNewCategoryName("");
                setRefreshFlag((f) => !f); // reload categories
            }
            catch (err) {
                alert(err.message);
            }
        }} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
              Add
            </button>
          </div>
        </div>
         {/* Toggle Delete List Button */}
          <button type="button" className="mt-2 text-sm text-red-600 underline hover:text-red-800" onClick={() => setShowDeleteList((show) => !show)}>
            {showDeleteList ? "Hide Delete Category List" : "Delete Category"}
          </button>

          {/* Conditionally rendered Delete List */}
          {showDeleteList && (<ul className="mt-2 max-h-40 overflow-auto border rounded p-2">
              {categories.map((cat) => (<li key={cat.id} className="flex items-center justify-between py-1">
                  <span>{cat.name}</span>
                  <button type="button" onClick={async () => {
                    if (!confirm(`Delete category "${cat.name}"?`))
                        return;
                    try {
                        const res = await fetch(`http://localhost:4000/admin/job-categories/${cat.id}`, {
                            method: "DELETE",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });
                        if (!res.ok) {
                            const data = await res.json();
                            throw new Error(data.error || "Failed to delete category");
                        }
                        setRefreshFlag((f) => !f); // refresh categories list
                        if (formData.category === cat.name) {
                            setFormData((prev) => ({ ...prev, category: "" }));
                        }
                        setShowDeleteList(false); // close after deletion
                    }
                    catch (err) {
                        alert(err.message);
                    }
                }} className="ml-2 text-red-600 hover:text-red-800" title="Delete Category">
                    Delete
                  </button>
                </li>))}
            </ul>)}

        {/* Country */}
        <div>
          <label htmlFor="country" className="block font-semibold mb-1">
            Country
          </label>
          <select id="country" name="country" value={formData.country || ""} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="">Select Country</option>
            {countries.map((c) => (<option key={c} value={c}>
                {c}
              </option>))}
          </select>
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block font-semibold mb-1">
            State
          </label>
          <select id="state" name="state" value={formData.state || ""} onChange={handleChange} disabled={formData.country !== "USA"} className="w-full border rounded px-3 py-2">
            <option value="">Select State</option>
            {states.map((s) => (<option key={s} value={s}>
                {s}
              </option>))}
          </select>
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block font-semibold mb-1">
            City
          </label>
          <select id="city" name="city" value={formData.city || ""} onChange={handleChange} disabled={!formData.state} className="w-full border rounded px-3 py-2">
            <option value="">Select City</option>
            {cities.map((c) => (<option key={c} value={c}>
                {c}
              </option>))}
          </select>
        </div>

        {/* Job Location */}
        <div>
          <label htmlFor="location" className="block font-semibold mb-1">
            Job Location
          </label>
          <select id="location" name="location" value={formData.location || ""} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="">Select Location</option>
            {LOCATION_OPTIONS.map((loc) => (<option key={loc} value={loc}>
                {loc}
              </option>))}
          </select>
        </div>

        {/* Salary */}
        <div>
          <label htmlFor="salary" className="block font-semibold mb-1">
            Salary
          </label>
          <input id="salary" name="salary" value={formData.salary || ""} onChange={handleChange} className="w-full border rounded px-3 py-2"/>
        </div>

        {/* Apply URL */}
        <div>
          <label htmlFor="apply_url" className="block font-semibold mb-1">
            Apply URL <span className="text-red-600">*</span>
          </label>

          <input id="apply_url" name="apply_url" type="url" value={formData.apply_url || ""} onChange={handleChange} required className="w-full border rounded px-3 py-2"/>
        </div>

        {/* Requirements */}
        <div>
          <label htmlFor="requirements" className="block font-semibold mb-1">
            Requirements
          </label>
          <textarea id="requirements" name="requirements" rows={4} value={formData.requirements || ""} onChange={handleChange} className="w-full border rounded px-3 py-2"/>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block font-semibold mb-1">
            Description
          </label>
          <textarea id="description" name="description" rows={4} value={formData.description || ""} onChange={handleChange} className="w-full border rounded px-3 py-2"/>
        </div>

        {/* Is Active and Expires At */}
        <div className="flex items-center space-x-4">
          <label htmlFor="is_active" className="font-semibold flex items-center space-x-2">
            <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active || false} onChange={handleChange}/>
            <span>Active</span>
          </label>

          <label htmlFor="expires_at" className="font-semibold">
            Expires At
          </label>
          <input id="expires_at" name="expires_at" type="date" value={formData.expires_at ? formData.expires_at.split("T")[0] : ""} onChange={handleChange} className="border rounded px-3 py-2"/>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">
          {selectedJob ? "Update Job" : "Create Job"}
        </button>
      </form>

      {/* Job Listing Table */}
      {loading ? (<p>Loading jobs...</p>) : jobs.length === 0 ? (<p>No jobs found.</p>) : (<table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2 text-left">Title</th>
              <th className="border px-4 py-2 text-left">Company</th>
              <th className="border px-4 py-2 text-left">Category</th>
              <th className="border px-4 py-2 text-left">Location</th>
              <th className="border px-4 py-2 text-left">Salary</th>
              <th className="border px-4 py-2 text-left">Job Type</th>
              <th className="border px-4 py-2 text-left">Country</th>
              <th className="border px-4 py-2 text-left">State</th>
              <th className="border px-4 py-2 text-left">City</th>
              <th className="border px-4 py-2 text-left">Active</th>
              <th className="border px-4 py-2 text-left">Expires At</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (<tr key={job.id} className="hover:bg-gray-100">
                <td className="border px-4 py-2">{job.title}</td>
                <td className="border px-4 py-2">{job.company}</td>
                <td className="border px-4 py-2">{job.category}</td>
                <td className="border px-4 py-2">{job.location}</td>
                <td className="border px-4 py-2">{job.salary}</td>
                <td className="border px-4 py-2">{job.job_type?.replace(/_/g, " ")}</td>
                <td className="border px-4 py-2">{job.country}</td>
                <td className="border px-4 py-2">{job.state}</td>
                <td className="border px-4 py-2">{job.city}</td>
                <td className="border px-4 py-2">{job.is_active ? "Yes" : "No"}</td>
                <td className="border px-4 py-2">{job.expires_at ? new Date(job.expires_at).toLocaleDateString() : "—"}</td>
                <td className="border px-4 py-2 space-x-2">
                  <button onClick={() => setSelectedJob(job)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(job.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                    Delete
                  </button>
                </td>
              </tr>))}
          </tbody>
        </table>)}
    </div>);
}
