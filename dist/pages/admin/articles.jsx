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
exports.default = AdminArticlesPage;
//This page to create admin backend to add - delete articles
const react_1 = __importStar(require("react"));
function AdminArticlesPage() {
    const [articles, setArticles] = (0, react_1.useState)([]);
    const [title, setTitle] = (0, react_1.useState)("");
    const [content, setContent] = (0, react_1.useState)("");
    const [coverImageFile, setCoverImageFile] = (0, react_1.useState)(null);
    const [coverImageUrl, setCoverImageUrl] = (0, react_1.useState)("");
    const [message, setMessage] = (0, react_1.useState)("");
    const [editingId, setEditingId] = (0, react_1.useState)(null);
    const fileInputRef = (0, react_1.useRef)(null);
    // Fetch all articles on load
    (0, react_1.useEffect)(() => {
        fetchArticles();
    }, []);
    const fetchArticles = async () => {
        const token = localStorage.getItem("token");
        if (!token)
            return;
        try {
            const res = await fetch("http://localhost:4000/admin/articles", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }
            else {
                setMessage("❌ Failed to fetch articles");
            }
        }
        catch (err) {
            console.error(err);
            setMessage("❌ Server error while fetching articles");
        }
    };
    const handleImageUpload = async () => {
        if (!coverImageFile)
            return;
        const formData = new FormData();
        formData.append("file", coverImageFile);
        formData.append("upload_preset", "ypropel_preset");
        try {
            const res = await fetch("https://api.cloudinary.com/v1_1/denggbgma/image/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok && data.secure_url) {
                setCoverImageUrl(data.secure_url);
                setMessage("✅ Image uploaded successfully");
            }
            else {
                setMessage("❌ Image upload failed: " + (data.error?.message || "Unknown error"));
            }
        }
        catch (err) {
            console.error("Image upload failed:", err);
            setMessage("❌ Image upload failed");
        }
    };
    const handleSubmit = async () => {
        const token = localStorage.getItem("token");
        if (!token)
            return;
        const url = editingId
            ? `http://localhost:4000/admin/articles/${editingId}`
            : "http://localhost:4000/admin/articles";
        const method = editingId ? "PUT" : "POST";
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    content,
                    cover_image: coverImageUrl,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(editingId ? "✅ Article updated successfully" : "✅ Article published successfully");
                setTitle("");
                setContent("");
                setCoverImageFile(null);
                setCoverImageUrl("");
                setEditingId(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                fetchArticles();
            }
            else {
                setMessage(`❌ Failed: ${data.error}`);
            }
        }
        catch (err) {
            console.error("Submit failed:", err);
            setMessage("❌ Server error");
        }
    };
    const handleEdit = (article) => {
        setEditingId(article.id);
        setTitle(article.title);
        setContent(article.content);
        setCoverImageUrl(article.cover_image || "");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setMessage("");
    };
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this article?"))
            return;
        const token = localStorage.getItem("token");
        if (!token)
            return;
        try {
            const res = await fetch(`http://localhost:4000/admin/articles/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setMessage("🗑️ Article deleted successfully");
                if (editingId === id) {
                    // Reset form if deleting currently edited article
                    setEditingId(null);
                    setTitle("");
                    setContent("");
                    setCoverImageUrl("");
                    setCoverImageFile(null);
                    if (fileInputRef.current)
                        fileInputRef.current.value = "";
                }
                fetchArticles();
            }
            else {
                const data = await res.json();
                setMessage(`❌ Failed to delete: ${data.error}`);
            }
        }
        catch (err) {
            console.error("Delete failed:", err);
            setMessage("❌ Server error");
        }
    };
    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle("");
        setContent("");
        setCoverImageUrl("");
        setCoverImageFile(null);
        if (fileInputRef.current)
            fileInputRef.current.value = "";
        setMessage("");
    };
    return (<div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{editingId ? "Edit Article" : "Publish New Article"}</h1>

      <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border px-3 py-2 rounded w-full mb-4"/>

      <textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} className="border px-3 py-2 rounded w-full mb-4 min-h-[150px]"/>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => {
            if (e.target.files?.[0]) {
                setCoverImageFile(e.target.files[0]);
            }
        }} className="mb-2"/>

      <button onClick={handleImageUpload} className="bg-blue-600 text-white px-4 py-1 rounded mb-4">
        Upload Image
      </button>

      {coverImageUrl && (<img src={coverImageUrl} alt="Preview" className="max-w-xs rounded mb-4"/>)}

      <div className="flex gap-4 mb-6">
        <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded flex-grow">
          {editingId ? "Update Article" : "Publish Article"}
        </button>
        {editingId && (<button onClick={handleCancelEdit} className="bg-gray-400 text-white px-4 py-2 rounded flex-grow">
            Cancel
          </button>)}
      </div>

      <h2 className="text-xl font-semibold mb-4">Existing Articles</h2>

      {articles.length === 0 ? (<p>No articles found.</p>) : (<ul className="space-y-4">
          {articles.map((article) => (<li key={article.id} className="border rounded p-4 flex items-center justify-between bg-white shadow">
              <div>
                <h3 className="font-semibold">{article.title}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(article)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">
                  Edit
                </button>
                <button onClick={() => handleDelete(article.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">
                  Delete
                </button>
              </div>
            </li>))}
        </ul>)}

      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>);
}
