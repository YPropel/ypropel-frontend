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
exports.default = PreCollegeSummer;
const react_1 = __importStar(require("react"));
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
function PreCollegeSummer() {
    const [programs, setPrograms] = (0, react_1.useState)([]);
    const [programTypes, setProgramTypes] = (0, react_1.useState)([]);
    const [filterType, setFilterType] = (0, react_1.useState)("All");
    const [filterPaid, setFilterPaid] = (0, react_1.useState)("All");
    (0, react_1.useEffect)(() => {
        const fetchPrograms = async () => {
            try {
                const res = await fetch("http://localhost:4000/summer-programs");
                const data = await res.json();
                setPrograms(data);
            }
            catch (err) {
                console.error("Failed to fetch programs", err);
            }
        };
        const fetchProgramTypes = async () => {
            try {
                const res = await fetch("http://localhost:4000/program-types");
                const data = await res.json();
                const typeNames = data.map((type) => type.name);
                setProgramTypes(typeNames);
            }
            catch (err) {
                console.error("Failed to fetch program types", err);
            }
        };
        fetchPrograms();
        fetchProgramTypes();
    }, []);
    const filtered = programs.filter((program) => {
        const typeMatch = filterType === "All" || program.program_type === filterType;
        const paidMatch = filterPaid === "All" ||
            (filterPaid === "Free" && !program.is_paid) ||
            (filterPaid === "Paid" && program.is_paid);
        return typeMatch && paidMatch;
    });
    return (<AuthGuard_1.default>
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Pre-College Summer Programs</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1 text-green-600">Program Type</label>
    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded p-2">
      <option value="All">All Types</option>
      <option value="Academic">Academic</option>
      <option value="Arts">Arts</option>
      <option value="Sports">Sports</option>
    </select>
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1 text-green-600">Paid\Free</label>
    <select value={filterPaid} onChange={(e) => setFilterPaid(e.target.value)} className="border rounded p-2">
      <option value="All">All</option>
      <option value="Free">Free</option>
      <option value="Paid">Paid</option>
    </select>
  </div>
    </div>


      {/* Program List */}
      {filtered.length === 0 ? (<p>No matching programs found.</p>) : (<ul className="space-y-4">
          {filtered.map((program) => (<li key={program.id} className="border p-4 rounded bg-white shadow">
              <h3 className="text-lg font-semibold">{program.title}</h3>
              <p className="text-sm text-gray-700">{program.description}</p>
              <p><strong>Type:</strong> {program.program_type}</p>
              <p><strong>Paid:</strong> {program.is_paid ? "Yes" : "No"}</p>
              <p><strong>Price:</strong> {program.price}</p>
              <p><strong>Location:</strong> {program.location}</p>
              <p>
                <strong>Website:</strong>{" "}
                <a href={program.program_url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                  Visit
                </a>
              </p>
              {program.cover_photo_url && (<img src={program.cover_photo_url} alt="Program" className="mt-2 w-40 h-28 object-cover border rounded"/>)}
            </li>))}
        </ul>)}
    </div>
     </AuthGuard_1.default>);
}
