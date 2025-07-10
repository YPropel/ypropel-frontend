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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResumeManager;
const react_1 = __importStar(require("react"));
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
function ResumeManager() {
    const [file, setFile] = (0, react_1.useState)(null);
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const [message, setMessage] = (0, react_1.useState)(null);
    const [resumes, setResumes] = (0, react_1.useState)([]);
    const [loadingResumes, setLoadingResumes] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Fetch resumes for the logged-in user
    const fetchResumes = async () => {
        setLoadingResumes(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token)
                throw new Error("Not authenticated");
            const res = await fetch("http://localhost:4000/members/resumes", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to fetch resumes");
            }
            const data = await res.json();
            setResumes(data);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoadingResumes(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchResumes();
    }, []);
    const handleFileChange = (e) => {
        if (e.target.files)
            setFile(e.target.files[0]);
    };
    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }
        setUploading(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append("resume", file);
            const token = localStorage.getItem("token");
            if (!token)
                throw new Error("Not authenticated");
            const response = await fetch("http://localhost:4000/members/resumes", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Upload failed");
            }
            const data = await response.json();
            setMessage("Upload successful!");
            setFile(null);
            fetchResumes(); // Refresh list after upload
        }
        catch (error) {
            setMessage("Upload failed: " + error.message);
        }
        finally {
            setUploading(false);
        }
    };
    const handleDelete = async (resumeId) => {
        if (!confirm("Are you sure you want to delete this resume?"))
            return;
        try {
            const token = localStorage.getItem("token");
            if (!token)
                throw new Error("Not authenticated");
            const res = await fetch(`http://localhost:4000/members/resumes/${resumeId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to delete resume");
            }
            setMessage("Resume deleted successfully");
            fetchResumes();
        }
        catch (err) {
            setMessage("Delete failed: " + err.message);
        }
    };
    return (<AuthGuard_1.default>
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Upload Your Resume</h1>

      <input type="file" onChange={handleFileChange} className="block w-full border p-2 rounded" accept=".pdf,.doc,.docx"/>

      <button onClick={handleUpload} className="bg-blue-900 text-white px-4 py-2 rounded mt-4 hover:bg-blue-800 disabled:opacity-50" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}

      <hr className="my-6"/>

      <h2 className="text-2xl font-semibold mb-4">Your Uploaded Resumes</h2>

      {loadingResumes ? (<p>Loading resumes...</p>) : error ? (<p className="text-red-600">{error}</p>) : resumes.length === 0 ? (<p>No resumes uploaded yet.</p>) : (<ul className="space-y-3">
          {resumes.map((resume) => (<li key={resume.id} className="border rounded p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{resume.file_name}</p>
                <p className="text-sm text-gray-600">Uploaded: {new Date(resume.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <a href={resume.resume_url} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                  Download
                </a>
                <button onClick={() => handleDelete(resume.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                  Delete
                </button>
              </div>
            </li>))}
        </ul>)}
    </div>
     </AuthGuard_1.default>);
}
