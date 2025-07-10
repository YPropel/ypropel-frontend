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
exports.default = JobsPage;
const react_1 = __importStar(require("react"));
const router_1 = require("next/router");
const link_1 = __importDefault(require("next/link"));
const AuthGuard_1 = __importDefault(require("../components/AuthGuard")); // adjust path if needed
const JOB_TYPES = [
    { label: "Internship", value: "internship" },
    { label: "Entry Level", value: "entry_level" },
    { label: "Hourly", value: "hourly" },
];
const LOCATION_OPTIONS = ["Remote", "Onsite", "Hybrid"];
function JobsPageContent() {
    const router = (0, router_1.useRouter)();
    const { type } = router.query;
    // Filters state
    const [country, setCountry] = (0, react_1.useState)("");
    const [state, setState] = (0, react_1.useState)("");
    const [city, setCity] = (0, react_1.useState)("");
    const [category, setCategory] = (0, react_1.useState)("");
    const [location, setLocation] = (0, react_1.useState)("");
    const [countries, setCountries] = (0, react_1.useState)([]);
    const [states, setStates] = (0, react_1.useState)([]);
    const [cities, setCities] = (0, react_1.useState)([]);
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [jobs, setJobs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [expandedJobId, setExpandedJobId] = (0, react_1.useState)(null);
    // Compute other job types for links (exclude current)
    const otherJobTypes = JOB_TYPES.filter((jt) => jt.value !== type);
    // Fetch job categories for filter drop down
    (0, react_1.useEffect)(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("http://localhost:4000/job-categories");
                if (!res.ok)
                    throw new Error("Failed to fetch categories");
                const data = await res.json();
                setCategories(data.map((cat) => cat.name));
            }
            catch (error) {
                console.error("Failed to load job categories:", error);
                setCategories([]);
            }
        }
        fetchCategories();
    }, []);
    // Fetch countries on mount
    (0, react_1.useEffect)(() => {
        async function fetchCountries() {
            try {
                const res = await fetch("http://localhost:4000/countries");
                if (!res.ok)
                    throw new Error("Failed to fetch countries");
                const data = await res.json();
                setCountries(data);
            }
            catch (error) {
                console.error(error);
            }
        }
        fetchCountries();
    }, []);
    // Fetch states when country changes
    (0, react_1.useEffect)(() => {
        if (!country) {
            setStates([]);
            setState("");
            return;
        }
        async function fetchStates() {
            try {
                const res = await fetch(`http://localhost:4000/us-states?country=${encodeURIComponent(country)}`);
                if (!res.ok)
                    throw new Error("Failed to fetch states");
                const data = await res.json();
                setStates(data);
            }
            catch (error) {
                console.error(error);
                setStates([]);
            }
        }
        fetchStates();
    }, [country]);
    // Fetch cities when state changes
    (0, react_1.useEffect)(() => {
        if (!state) {
            setCities([]);
            setCity("");
            return;
        }
        async function fetchCities() {
            try {
                const res = await fetch(`http://localhost:4000/us-cities?state=${encodeURIComponent(state)}`);
                if (!res.ok)
                    throw new Error("Failed to fetch cities");
                const data = await res.json();
                setCities(data);
            }
            catch (error) {
                console.error(error);
                setCities([]);
            }
        }
        fetchCities();
    }, [state]);
    // Fetch jobs whenever filters or type change
    (0, react_1.useEffect)(() => {
        if (!type)
            return;
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.append("job_type", type.toString());
        if (country)
            params.append("country", country);
        if (state)
            params.append("state", state);
        if (city)
            params.append("city", city);
        if (category)
            params.append("category", category);
        if (location)
            params.append("location", location);
        fetch(`http://localhost:4000/jobs?${params.toString()}`)
            .then((res) => {
            if (!res.ok)
                throw new Error("Failed to fetch jobs");
            return res.json();
        })
            .then((data) => {
            setJobs(data);
            setLoading(false);
            setExpandedJobId(null);
        })
            .catch((err) => {
            setError(err.message);
            setLoading(false);
        });
    }, [type, country, state, city, category, location]);
    const titleCase = (str) => {
        if (str === "internship")
            return "Internships";
        if (str === "entry_level")
            return "Entry-level Roles";
        if (str === "hourly")
            return "Hourly Roles";
        return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };
    if (!type)
        return <p className="p-4">Loading...</p>;
    if (loading)
        return <p className="p-4">Loading jobs...</p>;
    if (error)
        return <p className="p-4 text-red-600">Error: {error}</p>;
    return (<div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{titleCase(type.toString())}</h1>

      {/* Other job type links */}
      <div className="mb-6 space-x-4">
        {otherJobTypes.map((jt) => {
            let label = "";
            if (jt.value === "internship")
                label = "Internships";
            else if (jt.value === "entry_level")
                label = "Entry-level Roles";
            else if (jt.value === "hourly")
                label = "Hourly Roles";
            return (<link_1.default key={jt.value} href={`/jobs?type=${jt.value}`} className="inline-block px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition">
              {label}
            </link_1.default>);
        })}
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4">
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Countries</option>
          {countries.map((c) => (<option key={c} value={c}>
              {c}
            </option>))}
        </select>

        <select value={state} onChange={(e) => setState(e.target.value)} disabled={!country} className="border rounded px-3 py-2">
          <option value="">All States</option>
          {states.map((s) => (<option key={s} value={s}>
              {s}
            </option>))}
        </select>

        <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!state} className="border rounded px-3 py-2">
          <option value="">All Cities</option>
          {cities.map((c) => (<option key={c} value={c}>
              {c}
            </option>))}
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Categories</option>
          {categories.map((cat) => (<option key={cat} value={cat}>
              {cat}
            </option>))}
        </select>

        <select value={location} onChange={(e) => setLocation(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Location Types</option>
          {LOCATION_OPTIONS.map((loc) => (<option key={loc} value={loc}>
              {loc}
            </option>))}
        </select>

        <button onClick={() => {
            setCountry("");
            setState("");
            setCity("");
            setCategory("");
            setLocation("");
        }} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition" title="Clear Filters">
          Clear
        </button>
      </div>

      {/* Jobs list */}
      {jobs.length === 0 ? (<p>No jobs found for the selected filters.</p>) : (<ul>
          {jobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                return (<li key={job.id} className="border rounded p-4 mb-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                    <p className="text-gray-700">
                      <strong>Company:</strong> {job.company}
                    </p>
                    <p className="text-gray-700">
                      <strong>Location:</strong> {job.location}
                    </p>
                    <p className="text-gray-700">
                      <strong>Salary:</strong> {job.salary || "—"}
                    </p>

                    <p className="text-gray-700">
                      <strong>Country:</strong> {job.country || "—"}
                    </p>

                    <p className="text-gray-500 text-sm">
                      Posted on {new Date(job.posted_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button onClick={() => setExpandedJobId(isExpanded ? null : job.id)} className="text-blue-600 underline hover:text-blue-800">
                    {isExpanded ? "Hide Details" : "View Details"}
                  </button>
                </div>

                {isExpanded && (<div className="mt-4 border-t pt-4 text-gray-700">
                    {job.description && (<>
                        <h3 className="font-semibold mb-1">Description</h3>
                        <p className="whitespace-pre-line mb-3">{job.description}</p>
                      </>)}

                    {job.requirements && (<>
                        <h3 className="font-semibold mb-1">Requirements</h3>
                        <p className="whitespace-pre-line mb-3">{job.requirements}</p>
                      </>)}

                    {job.apply_url && (<a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                        Apply Now
                      </a>)}
                  </div>)}
              </li>);
            })}
        </ul>)}
    </div>);
}
function JobsPage() {
    return (<AuthGuard_1.default>
      <JobsPageContent />
    </AuthGuard_1.default>);
}
