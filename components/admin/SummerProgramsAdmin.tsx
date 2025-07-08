import React, { useEffect, useState, useRef } from "react";

export default function SummerProgramsAdmin() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [newProgram, setNewProgram] = useState({
    title: "",
    description: "",
    program_type: "",
    cover_photo_url: "",
    is_paid: false,
    price: "",
    location: "",
    program_url: "",
  });

  const [errors, setErrors] = useState({
    program_url: "",
    cover_photo_url: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateFields = () => {
    const newErrors: any = {};
    if (
      newProgram.program_url &&
      !/^https?:\/\/[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(newProgram.program_url)
    ) {
      newErrors.program_url = "Invalid website URL.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch("http://localhost:4000/summer-programs");
      const data = await res.json();
      setPrograms(data);
    } catch (err) {
      console.error("Failed to fetch programs", err);
    }
  };

  const [programTypes, setProgramTypes] = useState<string[]>([]);
  const [newTypeInput, setNewTypeInput] = useState("");

  const fetchProgramTypes = async () => {
    try {
      const res = await fetch("http://localhost:4000/program-types");
      const data = await res.json();
      setProgramTypes(data.map((t: any) => t.name));
    } catch (err) {
      console.error("Failed to fetch program types", err);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchProgramTypes();
  }, []);

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:4000/admin/summer-programs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setPrograms((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Failed to delete program");
    }
  };

  const handleAdd = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = {
      ...newProgram,
      price: parseFloat(newProgram.price) || 0,
    };

    if (!validateFields()) return;

    try {
      const res = await fetch("http://localhost:4000/admin/summer-programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add program");

      setNewProgram({
        title: "",
        description: "",
        program_type: "",
        cover_photo_url: "",
        is_paid: false,
        price: "",
        location: "",
        program_url: "",
      });
      setErrors({ program_url: "", cover_photo_url: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchPrograms();
    } catch (err) {
      alert("Failed to add program");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Admin: Summer Programs</h1>

      <div className="border p-4 rounded bg-white shadow">
        <h2 className="text-lg font-semibold mb-2">Add New Program</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["title", "program_type", "location", "program_url", "price"].map((field) => (
            <div key={field} className="flex flex-col">
              <input
                type="text"
                placeholder={field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                value={(newProgram as any)[field]}
                onChange={(e) =>
                  setNewProgram((prev) => ({ ...prev, [field]: e.target.value }))
                }
                className={`border rounded p-2 ${
                  errors[field as keyof typeof errors] ? "border-red-500" : ""
                }`}
              />
              {errors[field as keyof typeof errors] && (
                <span className="text-sm text-red-600 mt-1">
                  {errors[field as keyof typeof errors]}
                </span>
              )}
            </div>
          ))}

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Program Type</label>
            <select
              value={newProgram.program_type}
              onChange={(e) =>
                setNewProgram((prev) => ({ ...prev, program_type: e.target.value }))
              }
              className="border rounded p-2"
            >
              <option value="">Select a program type</option>
              {programTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col mt-2">
            <label className="text-sm font-medium mb-1">Add New Program Type</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTypeInput}
                onChange={(e) => setNewTypeInput(e.target.value)}
                placeholder="e.g. Academic"
                className="border rounded p-2 flex-grow"
              />
              <button
                onClick={async () => {
                  const token = localStorage.getItem("token");
                  if (!newTypeInput.trim() || !token) return;

                  try {
                    const res = await fetch("http://localhost:4000/admin/program-types", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ name: newTypeInput.trim() }),
                    });

                    const data = await res.json();
                    if (res.ok) {
                      setProgramTypes((prev) => [...prev, data.name]);
                      setNewProgram((prev) => ({
                        ...prev,
                        program_type: data.name,
                      }));
                      setNewTypeInput("");
                    } else {
                      alert(data.error || "Failed to add type");
                    }
                  } catch (err) {
                    console.error("Error adding new program type", err);
                    alert("Server error");
                  }
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Add
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Upload Cover Photo</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", "ypropel_preset");

                try {
                  const res = await fetch("https://api.cloudinary.com/v1_1/denggbgma/image/upload", {
                    method: "POST",
                    body: formData,
                  });

                  const data = await res.json();
                  if (data.secure_url) {
                    setNewProgram((prev) => ({
                      ...prev,
                      cover_photo_url: data.secure_url,
                    }));
                    setErrors((prev) => ({ ...prev, cover_photo_url: "" }));
                  } else {
                    setErrors((prev) => ({
                      ...prev,
                      cover_photo_url: data.error?.message || "Upload failed",
                    }));
                  }
                } catch (err) {
                  setErrors((prev) => ({
                    ...prev,
                    cover_photo_url: "Image upload failed. Try again.",
                  }));
                }
              }}
              className="border rounded p-2 w-full"
            />
            {errors.cover_photo_url && (
              <p className="text-red-600 text-sm mt-1">{errors.cover_photo_url}</p>
            )}
            {newProgram.cover_photo_url && (
              <img
                src={newProgram.cover_photo_url}
                alt="Preview"
                className="mt-2 max-h-40 rounded"
              />
            )}
          </div>

          <textarea
            placeholder="Description"
            value={newProgram.description}
            onChange={(e) =>
              setNewProgram((prev) => ({ ...prev, description: e.target.value }))
            }
            className="border rounded p-2 md:col-span-2"
            rows={4}
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={newProgram.is_paid}
              onChange={(e) =>
                setNewProgram((prev) => ({ ...prev, is_paid: e.target.checked }))
              }
            />
            <label>Paid Program?</label>
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
        >
          Add Program
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">All Programs</h2>
        {programs.length === 0 ? (
          <p>No programs available.</p>
        ) : (
          <ul className="space-y-4">
            {programs.map((program) => (
              <li
                key={program.id}
                className="border p-4 rounded bg-gray-50 shadow-sm space-y-1"
              >
                <p><strong>Title:</strong> {program.title}</p>
                <p><strong>Description:</strong> {program.description}</p>
                <p><strong>Type:</strong> {program.program_type}</p>
                <p><strong>Paid:</strong> {program.is_paid ? "Yes" : "No"}</p>
                <p><strong>Price:</strong> {program.price}</p>
                <p><strong>Location:</strong> {program.location}</p>
                <p>
                  <strong>URL:</strong>{" "}
                  <a
                    href={program.program_url}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit
                  </a>
                </p>
                {program.cover_photo_url && (
                  <img
                    src={program.cover_photo_url}
                    alt="Program"
                    className="w-40 h-28 object-cover border rounded"
                  />
                )}
                <button
                  onClick={() => handleDelete(program.id)}
                  className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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
