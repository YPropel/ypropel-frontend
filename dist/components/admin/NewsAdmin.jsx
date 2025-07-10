"use strict";
//--- This page is the backend component for News and Updates
//  forntend page to add - delete news. Its backend file with all the routes .get is
//Pages/admin/index.tsx
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
exports.default = NewsAdmin;
const react_1 = __importStar(require("react"));
function NewsAdmin() {
    const [title, setTitle] = (0, react_1.useState)("");
    const [content, setContent] = (0, react_1.useState)("");
    const [imageFile, setImageFile] = (0, react_1.useState)(null);
    const [previewUrl, setPreviewUrl] = (0, react_1.useState)(null);
    const [message, setMessage] = (0, react_1.useState)("");
    const [isSuccess, setIsSuccess] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [newsList, setNewsList] = (0, react_1.useState)([]);
    // Fetch all news posts
    const fetchNews = async () => {
        try {
            const res = await fetch("http://localhost:4000/news");
            const data = await res.json();
            if (res.ok) {
                setNewsList(data);
            }
            else {
                setMessage(`Failed to load news: ${data.error}`);
            }
        }
        catch (err) {
            console.error(err);
            setMessage("Error loading news");
        }
    };
    (0, react_1.useEffect)(() => {
        fetchNews();
    }, []);
    const handleImageUpload = async () => {
        if (!imageFile) {
            setMessage("⚠️ Please select an image");
            return null;
        }
        const formData = new FormData();
        formData.append("image", imageFile);
        try {
            const res = await fetch("http://localhost:4000/upload-news-image", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                return data.imageUrl;
            }
            else {
                setIsSuccess(false);
                setMessage(`Image upload failed: ${data.error}`);
                return null;
            }
        }
        catch (error) {
            setIsSuccess(false);
            setMessage("Image upload error");
            return null;
        }
    };
    //--------Handle Submit button to add news post from admin backend to news&updates frontend page
    const handleSubmit = async () => {
        console.log("🟡 Submit button clicked");
        const token = localStorage.getItem("token");
        if (!token) {
            setIsSuccess(false);
            setMessage("Missing auth token");
            return;
        }
        if (!imageFile) {
            console.warn("⚠️ No image file selected");
            setMessage("Please select an image.");
            return;
        }
        setLoading(true);
        const imageUrl = await handleImageUpload();
        if (!imageUrl) {
            setLoading(false);
            return;
        }
        const res = await fetch("http://localhost:4000/news", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, content, image_url: imageUrl }),
        });
        const data = await res.json();
        if (res.ok) {
            setIsSuccess(true);
            setMessage("✅ News created!");
            setTitle("");
            setContent("");
            setImageFile(null);
            setPreviewUrl(null);
            fetchNews(); // Refresh news list
        }
        else {
            setIsSuccess(false);
            setMessage(`❌ Failed: ${data.error}`);
        }
        setLoading(false);
    };
    //---HAndle news image
    const handleImageChange = (e) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    };
    //--------HAndle delete news and updates for Admin 
    // //Note: the News and update delete route for admin is in the ypropel-backend index.tsx
    const handleDelete = async (id) => {
        const token = localStorage.getItem("token");
        if (!token)
            return;
        console.log("Deleting news with ID:", id);
        console.log("JWT token:", token);
        try {
            const res = await fetch(`http://localhost:4000/admin/news/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (res.ok) {
                setMessage("🗑️ News deleted");
                setNewsList((prev) => prev.filter((n) => n.id !== id));
            }
            else {
                setMessage(`❌ Failed to delete: ${data.error}`);
            }
        }
        catch (error) {
            setMessage("❌ Server error");
        }
    };
    //-------------------------
    return (<div className="max-w-3xl mx-auto mt-10 p-4 border rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create News Post</h2>

      <input type="text" placeholder="News title" className="w-full border px-3 py-2 mb-3" value={title} onChange={(e) => setTitle(e.target.value)}/>
      <textarea placeholder="News content" className="w-full border px-3 py-2 mb-3" rows={4} value={content} onChange={(e) => setContent(e.target.value)}/>
      <input type="file" accept="image/*" className="mb-3" onChange={handleImageChange}/>
      {previewUrl && (<img src={previewUrl} alt="Preview" className="mb-4 max-h-40 object-contain border rounded"/>)}
      <button onClick={handleSubmit} disabled={loading} className={`px-4 py-2 rounded text-white ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600"}`}>
        {loading ? "Uploading..." : "Submit"}
      </button>
      {message && (<p className={`mt-4 text-sm ${isSuccess ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>)}

      <hr className="my-6"/>

      <h3 className="text-lg font-semibold mb-2">📰 Existing News</h3>
      {newsList.map((news) => (<div key={news.id} className="mb-4 p-3 border rounded">
          <h4 className="font-bold">{news.title}</h4>
          <p className="text-sm">{news.content}</p>
          <img src={news.image_url} alt={news.title} className="mt-2 max-h-40 object-contain"/>
          <button onClick={() => handleDelete(news.id)} className="mt-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
            Delete
          </button>
        </div>))}
    </div>);
}
