import React, { useState, useEffect, ChangeEvent } from "react";
import AuthGuard from "../components/AuthGuard";
import { apiFetch } from "../apiClient"; 
type ServiceType = {
  id: number;
  name: string;
};

type FreelanceService = {
  id: number;
  member_id?: number; // ownership field from backend
  name: string;
  description?: string;
  about?: string;
  service_type?: string;
  other_service?: string;
  state?: string;
  city?: string;
  rate?: string;
  email?: string;
  website?: string;
  profile_photo?: string; // profile image URL from backend (user photo_url)
};

export default function FreelancePage() {
  const [services, setServices] = useState<FreelanceService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [modalService, setModalService] = useState<FreelanceService | null>(null);

  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    description: "",
    about: "",
    service_type: "",
    other_service: "",   // <-- Added this new field
    state: "",
    city: "",
    rate: "",
    email: "",
    website: "",
  });

  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [serviceOptions, setServiceOptions] = useState<ServiceType[]>([]);

  // Filter states for the filters (separate from form)
  const [filterServiceType, setFilterServiceType] = useState<string>("");
  const [filterState, setFilterState] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterCities, setFilterCities] = useState<string[]>([]);

  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);

  // Load logged in user id on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const idStr = localStorage.getItem("userId");
      if (idStr) setLoggedInUserId(Number(idStr));
    }
  }, []);

  // Fetch service types on mount
  useEffect(() => {
    async function fetchServiceTypes() {
      try {
        const res = await apiFetch("/service-types");
        if (!res.ok) throw new Error("Failed to fetch service types");
        const data = await res.json();
        setServiceOptions(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchServiceTypes();
  }, []);

  // Fetch services and states on mount
  useEffect(() => {
    fetchServices();
    fetchStates();
  }, []);

  // Fetch filter cities on filterState change
  useEffect(() => {
    if (filterState) {
      fetchFilterCities(filterState);
    } else {
      setFilterCities([]);
      setFilterCity("");
    }
  }, [filterState]);

  // Fetch cities for filter city dropdown
  async function fetchFilterCities(state: string) {
    try {
      const res = await apiFetch(`/us-cities?state=${encodeURIComponent(state)}`);
      if (!res.ok) throw new Error("Failed to fetch cities");
      const data = await res.json();
      setFilterCities(data);
      if (!data.includes(filterCity)) {
        setFilterCity("");
      }
    } catch (err) {
      console.error(err);
      setFilterCities([]);
    }
  }

  // Fetch cities for FORM city dropdown with stale closure fix
  useEffect(() => {
    if (formData.state) {
      fetchCities(formData.state, formData.city);
    } else {
      setCities([]);
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  }, [formData.state]);

  async function fetchCities(state: string, currentCity: string) {
    try {
      const res = await apiFetch(`/us-cities?state=${encodeURIComponent(state)}`);
      if (!res.ok) throw new Error("Failed to fetch cities");
      const data = await res.json();
      setCities(data);
      if (!data.includes(currentCity)) {
        setFormData((prev) => ({ ...prev, city: "" }));
      }
    } catch (err) {
      console.error(err);
      setCities([]);
    }
  }

  async function fetchServices() {
    setLoadingServices(true);
    setFetchError("");
    try {
      const res = await apiFetch("/freelance-services", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(data);
    } catch (err: any) {
      setFetchError(err.message || "Error fetching services");
    } finally {
      setLoadingServices(false);
    }
  }

  async function fetchStates() {
    try {
      const res = await apiFetch("/us-states");
      if (!res.ok) throw new Error("Failed to fetch states");
      const data = await res.json();
      setStates(data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "service_type") {
      setFormData(prev => ({
        ...prev,
        service_type: value,
        other_service: value === "other" ? prev.other_service : "",
      }));
      return;
    }

    if (name === "about") {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length > 100) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      id: 0,
      name: "",
      description: "",
      about: "",
      service_type: "",
      other_service: "",
      state: "",
      city: "",
      rate: "",
      email: "",
      website: "",
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const body = { ...formData };
      delete body.id;

      let url = "/freelance-services";
      let method = "POST";

      if (formData.id && formData.id > 0) {
        url = `/freelance-services/${formData.id}`;
        method = "PUT";
      }

      const res = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit service");
      }

      await fetchServices();
      resetForm();
    } catch (err: any) {
      alert(err.message || "Error submitting form");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const res = await apiFetch(`/freelance-services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete service");
      }

      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch (err: any) {
      alert(err.message || "Error deleting service");
    }
  };

  const handleEdit = (service: FreelanceService) => {
    setFormData({
      id: service.id,
      name: service.name || "",
      description: service.description || "",
      about: service.about || "",
      service_type: service.service_type || "",
      other_service: "", // optionally prefill this if you save it
      state: service.state || "",
      city: service.city || "",
      rate: service.rate || "",
      email: service.email || "",
      website: service.website || "",
    });
    setShowForm(true);
  };

  const openModal = (service: FreelanceService) => {
    setModalService(service);
  };

  const closeModal = () => {
    setModalService(null);
  };

  // Filter services for display based on filters
  const filteredServices = services.filter(service => {
    const matchesServiceType = filterServiceType ? service.service_type === filterServiceType : true;
    const matchesState = filterState ? service.state === filterState : true;
    const matchesCity = filterCity ? service.city === filterCity : true;
    return matchesServiceType && matchesState && matchesCity;
  });

  return (
      <AuthGuard>
    <div className="p-6 space-y-6">
      {/* Header and Add Expert button */}
      <div className="bg-blue-900 text-white p-4 rounded shadow flex justify-between items-center">
        <h1 className="text-2xl font-bold">Freelance Services</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-white text-blue-900 font-semibold px-4 py-2 rounded shadow hover:bg-gray-100"
        >
          {showForm ? "Cancel" : formData.id > 0 ? "Edit Expert" : "Add Expert"}
        </button>
      </div>

      {/* === FILTER DROPDOWNS (with 'All' options) === */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <select
    value={filterServiceType}
    onChange={e => setFilterServiceType(e.target.value)}
    className="w-full p-2 border rounded"
  >
    <option value="">All Service Types</option> {/* <-- Added 'All' */}
    {serviceOptions.map(type => (
      <option key={type.id} value={type.id.toString()}>
        {type.name}
      </option>
    ))}
  </select>

  <select
    value={filterState}
    onChange={e => setFilterState(e.target.value)}
    className="w-full p-2 border rounded"
  >
    <option value="">All States</option> {/* <-- Added 'All' */}
    {states.map(st => (
      <option key={st} value={st}>
        {st}
      </option>
    ))}
  </select>

  <select
    value={filterCity}
    onChange={e => setFilterCity(e.target.value)}
    disabled={!filterState}
    className="w-full p-2 border rounded"
  >
    <option value="">All Cities</option> {/* <-- Added 'All' */}
    {filterCities.map(ct => (
      <option key={ct} value={ct}>
        {ct}
      </option>
    ))}
  </select>
</div>


      {/* ADD / EDIT FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Short Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          <textarea
            name="about"
            placeholder="About You - max 100 words"
            value={formData.about}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Contact Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          <input
            type="url"
            name="website"
            placeholder="Website"
            value={formData.website}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          <select
            name="service_type"
            value={formData.service_type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Service Type</option>
            {serviceOptions.map(type => (
              <option key={type.id} value={type.id.toString()}>
                {type.name}
              </option>
            ))}
            <option value="other">Other</option>
          </select>

          {formData.service_type === "other" && (
            <input
              type="text"
              name="other_service"
              placeholder="Please specify your service"
              value={formData.other_service}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-2"
              required
            />
          )}

          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select State</option>
            {states.map(st => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={!formData.state}
            className="w-full p-2 border rounded"
          >
            <option value="">Select City</option>
            {cities.map(ct => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="rate"
            placeholder="Hourly Rate"
            value={formData.rate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />

          <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded">
            {formData.id > 0 ? "Update Expert" : "Add Expert"}
          </button>
        </form>
      )}

      {/* SERVICES LIST */}
      {loadingServices && <p>Loading your services...</p>}
      {fetchError && <p className="text-red-600">{fetchError}</p>}
      {!loadingServices && filteredServices.length === 0 && <p>No freelance services found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <div
            key={service.id}
            className="border rounded p-6 shadow flex flex-col justify-between"
            style={{ minHeight: "420px" }}
          >
            {service.profile_photo ? (
              <img
                src={
                  service.profile_photo.startsWith("http")
                    ? service.profile_photo
                    : `/${service.profile_photo}`
                }
                alt={`${service.name} profile`}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto flex items-center justify-center text-gray-600 mb-4">
                No Image
              </div>
            )}

            <h2 className="font-semibold text-blue-900 text-center mb-2">{service.name}</h2>

            <div className="flex justify-center mb-4">
              <button
                onClick={() => openModal(service)}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
              >
                Details
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-1">Contact: {service.email || "N/A"}</p>
            <p className="text-sm text-gray-500 mb-1">
              Website:{" "}
              {service.website ? (
                <a
                  href={service.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600"
                >
                  {service.website}
                </a>
              ) : (
                "N/A"
              )}
            </p>
            <p className="text-sm text-gray-500 mb-1">
              Location: {service.state || ""} {service.city ? `, ${service.city}` : ""}
            </p>
            <p className="text-sm text-gray-500 mb-1">
              Service Type:{" "}
              {service.other_service && service.other_service.trim() !== ""
                ? service.other_service
                : serviceOptions.find((s) => s.id === Number(service.service_type))?.name || "N/A"}
            </p>
            <p className="text-sm text-gray-500 mb-1">Rate: {service.rate || "N/A"}</p>

            {service.member_id === loggedInUserId && (
              <div className="flex gap-4 mt-4 justify-center">
                <button
                  onClick={() => handleEdit(service)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalService && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl font-bold"
              onClick={closeModal}
              aria-label="Close modal"
            >
              &times;
            </button>
            <h2 className="text-2xl font-semibold mb-4">{modalService.name}</h2>
            {modalService.profile_photo && (
              <img
                src={
                  modalService.profile_photo.startsWith("http")
                    ? modalService.profile_photo
                    : `/${modalService.profile_photo}`
                }
                alt={`${modalService.name} profile`}
                className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
              />
            )}
            <p className="mb-2"><strong>Description:</strong> {modalService.description || "N/A"}</p>
            <p className="mb-2"><strong>About:</strong> {modalService.about || "N/A"}</p>
            <p className="mb-2"><strong>Contact:</strong> {modalService.email || "N/A"}</p>
            <p className="mb-2">
              <strong>Website:</strong>{" "}
              {modalService.website ? (
                <a
                  href={modalService.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600"
                >
                  {modalService.website}
                </a>
              ) : (
                "N/A"
              )}
            </p>
            <p className="mb-2">
              <strong>Location:</strong> {modalService.state || ""} {modalService.city ? `, ${modalService.city}` : ""}
            </p>
            <p className="mb-2">
              <strong>Service Type:</strong>{" "}
              {serviceOptions.find((s) => s.id === Number(modalService.service_type))?.name || "N/A"}
            </p>
            <p className="mb-2"><strong>Rate:</strong> {modalService.rate || "N/A"}</p>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
