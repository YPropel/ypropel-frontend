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
exports.default = JobFairsPage;
const react_1 = __importStar(require("react"));
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
function JobFairsPage() {
    const [jobFairs, setJobFairs] = (0, react_1.useState)([]);
    const [stateFilter, setStateFilter] = (0, react_1.useState)("");
    const [cityFilter, setCityFilter] = (0, react_1.useState)("");
    const [availableStates, setAvailableStates] = (0, react_1.useState)([]);
    const [availableCities, setAvailableCities] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchJobFairs = async () => {
            try {
                const res = await fetch("http://localhost:4000/job-fairs");
                const data = await res.json();
                setJobFairs(data);
            }
            catch (error) {
                console.error("Failed to fetch job fairs:", error);
            }
        };
        fetchJobFairs();
    }, []);
    (0, react_1.useEffect)(() => {
        const fetchStates = async () => {
            try {
                const res = await fetch("http://localhost:4000/us-states");
                const data = await res.json();
                setAvailableStates(data);
            }
            catch (error) {
                console.error("Failed to fetch states:", error);
            }
        };
        fetchStates();
    }, []);
    (0, react_1.useEffect)(() => {
        if (!stateFilter) {
            setAvailableCities([]);
            return;
        }
        const fetchCities = async () => {
            try {
                const res = await fetch(`http://localhost:4000/us-cities?state=${encodeURIComponent(stateFilter)}`);
                const data = await res.json();
                setAvailableCities(data);
            }
            catch (error) {
                console.error("Failed to fetch cities:", error);
            }
        };
        fetchCities();
    }, [stateFilter]);
    const filteredJobFairs = jobFairs
        .filter((job) => {
        const [state, city] = job.location.split(" - ");
        const matchState = stateFilter ? state === stateFilter : true;
        const matchCity = cityFilter ? city === cityFilter : true;
        return matchState && matchCity;
    })
        .sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());
    return (<AuthGuard_1.default>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Explore Job Fairs</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <select value={stateFilter} onChange={(e) => {
            setStateFilter(e.target.value);
            setCityFilter("");
        }} className="border px-3 py-2 rounded">
          <option value="">All States</option>
          {availableStates.map((s) => (<option key={s} value={s}>
              {s}
            </option>))}
        </select>

        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="border px-3 py-2 rounded" disabled={!stateFilter}>
          <option value="" disabled>
            {stateFilter ? "Select a City" : "Choose a State First"}
          </option>
          {availableCities.map((c) => (<option key={c} value={c}>
              {c}
            </option>))}
        </select>
      </div>

      {filteredJobFairs.length === 0 ? (<p>No job fairs found.</p>) : (<ul className="space-y-6">
          {filteredJobFairs.map((job) => (<li key={job.id} className="border rounded-lg p-4 shadow">
              <h2 className="text-xl font-semibold">{job.title}</h2>
              <p className="text-sm text-gray-700 mt-1">{job.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                📍 {job.location} | 🕒{" "}
                {new Date(job.start_datetime).toLocaleString()}
              </p>
              <a href={job.website} target="_blank" rel="noreferrer" className="text-blue-600 underline mt-2 block">
                Visit Website
              </a>
              <img src={job.cover_image_url ||
                    "https://via.placeholder.com/300x200?text=Job+Fair"} alt={job.title} className="w-full max-w-sm mt-3 rounded" onError={(e) => {
                    e.currentTarget.src =
                        "https://via.placeholder.com/300x200?text=Job+Fair";
                }}/>
            </li>))}
        </ul>)}
    </div>
    </AuthGuard_1.default>);
}
