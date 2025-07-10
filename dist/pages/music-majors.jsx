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
exports.default = MusicMajors;
const react_1 = __importStar(require("react"));
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
const BACKEND_BASE_URL = "http://localhost:4000";
function MusicMajors() {
    const [majors, setMajors] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        async function fetchMajors() {
            try {
                const res = await fetch(`${BACKEND_BASE_URL}/music-majors`);
                if (!res.ok)
                    throw new Error(`Failed to fetch music majors: ${res.statusText}`);
                const data = await res.json();
                setMajors(data);
            }
            catch (err) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        }
        fetchMajors();
    }, []);
    if (loading)
        return <p className="p-6">Loading music majors...</p>;
    if (error)
        return <p className="p-6 text-red-600">Error: {error}</p>;
    return (<AuthGuard_1.default>
    <div className="max-w-7xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-3xl font-semibold text-blue-900 mb-4" style={{ color: "#001f4d" }} // dark navy blue header
    >
        Popular Music Majors
      </h1>
      {majors.length === 0 ? (<p>No music majors found.</p>) : (<ul className="space-y-6">
          {majors.map(({ id, title, description, top_universities, cover_photo_url }) => (<li key={id} className="border rounded p-4 shadow-sm hover:shadow-md transition flex items-center gap-4">
              {cover_photo_url && (<img src={cover_photo_url} alt={title} className="w-24 h-24 object-cover rounded"/>)}
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-gray-700">{description}</p>
                {top_universities && (<p className="mt-2 italic text-sm text-green-700">
                    <strong>Top Universities:</strong> {top_universities}
                  </p>)}
              </div>
            </li>))}
        </ul>)}
    </div>
    </AuthGuard_1.default>);
}
