import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "../../apiClient";

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
    const token = localStorage.getItem("token");
    try {
      const res = await apiFetch("/summer-programs", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch programs");
      const data = await res.json();
      setPrograms(data);
    } catch (err) {
      console.error("Failed to fetch programs", err);
    }
  };

  const [programTypes, setProgramTypes] = useState<string[]>([]);
  const [newTypeInput, setNewTypeInput] = useState("");

  const fetchProgramTypes = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await apiFetch("/program-types", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch program types");
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
      const res = await apiFetch(`/admin/summer-programs/${id}`, {
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
      const res = await apiFetch("/admin/summer-programs", {
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
      {/* ...rest of your JSX unchanged */}
    </div>
  );
}
