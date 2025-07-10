"use strict";
// pages/admin/job-fairs.tsx
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
exports.default = AdminJobFairs;
const react_1 = __importStar(require("react"));
function AdminJobFairs() {
    const [jobFairs, setJobFairs] = (0, react_1.useState)([]);
    const [states, setStates] = (0, react_1.useState)([]);
    const [cities, setCities] = (0, react_1.useState)([]);
    const [selectedState, setSelectedState] = (0, react_1.useState)("");
    const fileInputRef = (0, react_1.useRef)(null);
    const [newJobFair, setNewJobFair] = (0, react_1.useState)({
        title: "",
        description: "",
        website: "",
        cover_photo_url: "",
        location_state: "",
        location_city: "",
        start_datetime: "",
    });
    const fetchStates = async () => {
        const res = await fetch("http://localhost:4000/us-states");
        const data = await res.json();
        setStates(data);
    };
    const fetchCities = async (state) => {
        const res = await fetch(`http://localhost:4000/us-cities?state=${encodeURIComponent(state)}`);
        const data = await res.json();
        setCities(data);
    };
    const fetchJobFairs = async () => {
        const res = await fetch("http://localhost:4000/job-fairs");
        const data = await res.json();
        setJobFairs(data);
    };
    (0, react_1.useEffect)(() => {
        fetchStates();
        fetchJobFairs();
    }, []);
    (0, react_1.useEffect)(() => {
        if (selectedState) {
            fetchCities(selectedState);
        }
    }, [selectedState]);
    const handleImageUpload = async (file) => {
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
    const handleAdd = async () => {
        const token = localStorage.getItem("token");
        if (!token)
            return;
        const { title, description, website, cover_photo_url, location_state, location_city, start_datetime, } = newJobFair;
        const location = `${location_state} - ${location_city}`;
        // Validate required fields
        if (!title.trim() ||
            !description.trim() ||
            !website.trim() ||
            !cover_photo_url.trim() ||
            !location_state ||
            !location_city ||
            !start_datetime) {
            alert("Please fill in all required fields before submitting.");
            return;
        }
        // ✅ Validate website format
        try {
            new URL(website);
        }
        catch (err) {
            alert("Please enter a valid website URL (e.g. https://example.com)");
            return;
        }
        const payload = {
            ...newJobFair,
            location,
        };
        console.log("📤 Submitting job fair:", JSON.stringify(payload, null, 2));
        const res = await fetch("http://localhost:4000/admin/job-fairs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("❌ Server error:", errorText);
            alert("Failed to add job fair.");
            return;
        }
        // ✅ Clear form after success
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
        if (fileInputRef.current)
            fileInputRef.current.value = "";
        fetchJobFairs();
    };
    const handleDelete = async (id) => {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:4000/admin/job-fairs/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setJobFairs((prev) => prev.filter((j) => j.id !== id));
        }
        else {
            alert("Failed to delete.");
        }
    };
    return (<div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin: Job Fairs</h1>

      {/* Add Form */}
      <div className="space-y-4 mb-6 border p-4 rounded">
        <input type="text" placeholder="Title" value={newJobFair.title} onChange={(e) => setNewJobFair({ ...newJobFair, title: e.target.value })} className="w-full border p-2 rounded"/>
        <textarea placeholder="Description" value={newJobFair.description} onChange={(e) => setNewJobFair({ ...newJobFair, description: e.target.value })} className="w-full border p-2 rounded"/>
        <input type="url" placeholder="Event Website" value={newJobFair.website} onChange={(e) => setNewJobFair({ ...newJobFair, website: e.target.value })} className="w-full border p-2 rounded"/>
        <input type="datetime-local" value={newJobFair.start_datetime} onChange={(e) => setNewJobFair({ ...newJobFair, start_datetime: e.target.value })} className="w-full border p-2 rounded"/>

        <div className="flex gap-2">
          <select value={newJobFair.location_state} onChange={(e) => {
            setSelectedState(e.target.value);
            setNewJobFair((prev) => ({ ...prev, location_state: e.target.value, location_city: "" }));
        }} className="border p-2 rounded w-1/2">
            <option value="">Select State</option>
            {states.map((s) => (<option key={s} value={s}>
                {s}
              </option>))}
          </select>
          <select value={newJobFair.location_city} onChange={(e) => setNewJobFair((prev) => ({ ...prev, location_city: e.target.value }))} className="border p-2 rounded w-1/2">
            <option value="">Select City</option>
            {cities.map((c) => (<option key={c} value={c}>
                {c}
              </option>))}
          </select>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="w-full"/>
        {newJobFair.cover_photo_url && (<img src={newJobFair.cover_photo_url} alt="Preview" className="w-40 mt-2 rounded"/>)}
        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded">
          Add Job Fair
        </button>
      </div>

      {/* List */}
      <div>
        <h2 className="text-xl font-semibold mb-2">All Job Fairs</h2>
        {jobFairs.length === 0 ? (<p>No job fairs yet.</p>) : (<ul className="space-y-4">
            {jobFairs.map((job) => (<li key={job.id} className="border p-4 rounded space-y-1">
                <p><strong>Title:</strong> {job.title}</p>
                <p><strong>Description:</strong> {job.description}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Start:</strong> {job.start_datetime}</p>
                <p><strong>Website:</strong> <a href={job.website} className="text-blue-600 underline" target="_blank" rel="noreferrer">Visit</a></p>
                {job.cover_image_url && (<img src={job.cover_image_url} alt="Job Fair" className="w-40 rounded"/>)}
                <button onClick={() => handleDelete(job.id)} className="mt-2 px-3 py-1 bg-red-600 text-white rounded">
                  Delete
                </button>
              </li>))}
          </ul>)}
      </div>
    </div>);
}
