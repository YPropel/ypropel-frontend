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
exports.default = AdminMiniCourses;
const react_1 = __importStar(require("react"));
function AdminMiniCourses() {
    const [courses, setCourses] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const fileInputRef = (0, react_1.useRef)(null);
    const [formData, setFormData] = (0, react_1.useState)({
        title: "",
        description: "",
        brief: "",
        cover_photo_url: "",
        author_id: undefined,
        price: undefined,
        category: "",
        duration: "",
        content_url: "",
    });
    const [editingId, setEditingId] = (0, react_1.useState)(null);
    async function fetchCourses() {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:4000/mini-courses");
            if (!res.ok)
                throw new Error("Failed to fetch courses");
            const data = await res.json();
            setCourses(data);
        }
        catch (err) {
            setError(err.message || "Unknown error");
        }
        finally {
            setLoading(false);
        }
    }
    (0, react_1.useEffect)(() => {
        fetchCourses();
    }, []);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleImageUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0)
            return;
        const file = e.target.files[0];
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);
        try {
            setUploading(true);
            const res = await fetch("http://localhost:4000/upload-news-image", {
                method: "POST",
                body: formDataUpload,
            });
            if (!res.ok)
                throw new Error("Failed to upload image");
            const data = await res.json();
            setFormData((prev) => ({ ...prev, cover_photo_url: data.imageUrl }));
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
        catch (err) {
            alert(err.message || "Error uploading image");
        }
        finally {
            setUploading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editingId ? "PUT" : "POST";
        const url = editingId
            ? `http://localhost:4000/mini-courses/${editingId}`
            : "http://localhost:4000/mini-courses";
        const bodyData = {
            ...formData,
            author_id: formData.author_id ? Number(formData.author_id) : null,
            price: formData.price ? Number(formData.price) : null,
        };
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Not authorized. Please log in.");
            return;
        }
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bodyData),
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to ${editingId ? "update" : "create"} course: ${errorText}`);
            }
            alert(`Course ${editingId ? "updated" : "created"} successfully`);
            setFormData({
                title: "",
                description: "",
                brief: "",
                cover_photo_url: "",
                author_id: undefined,
                price: undefined,
                category: "",
                duration: "",
                content_url: "",
            });
            setEditingId(null);
            fetchCourses();
        }
        catch (err) {
            alert(err.message || "Error submitting form");
        }
    };
    const handleEdit = (course) => {
        setFormData({
            title: course.title || "",
            description: course.description || "",
            brief: course.brief || "",
            cover_photo_url: course.cover_photo_url || "",
            author_id: course.author_id,
            price: course.price,
            category: course.category || "",
            duration: course.duration || "",
            content_url: course.content_url || "",
        });
        setEditingId(course.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this course?"))
            return;
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Not authorized. Please log in.");
            return;
        }
        try {
            const res = await fetch(`http://localhost:4000/mini-courses/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to delete course: ${errorText}`);
            }
            alert("Course deleted successfully");
            fetchCourses();
        }
        catch (err) {
            alert(err.message || "Error deleting course");
        }
    };
    return (<div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Mini Courses</h1>

      <form onSubmit={handleSubmit} className="mb-10 space-y-4 max-w-2xl">
        <input type="text" name="title" placeholder="Course Title" value={formData.title} onChange={handleChange} required className="w-full border rounded px-3 py-2"/>
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="w-full border rounded px-3 py-2"/>

        <textarea name="brief" placeholder="Brief (Course Goals / What you'll learn)" value={formData.brief} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={3}/>

        <div>
          <label className="block mb-1 font-semibold">Cover Image</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="mb-2"/>
          {uploading && <p>Uploading image...</p>}

          {formData.cover_photo_url && (<img src={formData.cover_photo_url} alt="Cover preview" className="w-full h-40 object-cover rounded"/>)}
        </div>

        <input type="number" name="author_id" placeholder="Author ID" value={formData.author_id || ""} onChange={handleChange} className="w-full border rounded px-3 py-2"/>
        <input type="number" name="price" placeholder="Price" value={formData.price || ""} onChange={handleChange} className="w-full border rounded px-3 py-2"/>
        <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} className="w-full border rounded px-3 py-2"/>
        <input type="text" name="duration" placeholder="Duration" value={formData.duration} onChange={handleChange} className="w-full border rounded px-3 py-2"/>

        <textarea name="content_url" placeholder="Course Content (HTML or plain text)" value={formData.content_url} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={10}/>

        <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled={uploading}>
          {editingId ? "Update Course" : "Add Course"}
        </button>
      </form>

      {loading ? (<p>Loading courses...</p>) : error ? (<p className="text-red-600">Error: {error}</p>) : courses.length === 0 ? (<p>No courses found.</p>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (<div key={course.id} className="border rounded-lg shadow overflow-hidden flex flex-col">
              {course.cover_photo_url ? (<img src={course.cover_photo_url.startsWith("http")
                        ? course.cover_photo_url
                        : `http://localhost:4000${course.cover_photo_url}`} alt={course.title} className="w-full h-40 object-cover"/>) : (<div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No image</span>
                </div>)}

              <div className="p-4 flex-grow">
                <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
                <p className="text-gray-700">
                  {course.brief
                    ? course.brief.length > 100
                        ? course.brief.slice(0, 100) + "..."
                        : course.brief
                    : course.description
                        ? course.description.length > 100
                            ? course.description.slice(0, 100) + "..."
                            : course.description
                        : "No description available."}
                </p>
              </div>

              <div className="flex justify-between p-4 border-t">
                <button onClick={() => handleEdit(course)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Edit
                </button>
                <button onClick={() => handleDelete(course.id)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Delete
                </button>
              </div>
            </div>))}
        </div>)}
    </div>);
}
