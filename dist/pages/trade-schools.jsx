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
exports.default = TradeSchools;
const react_1 = __importStar(require("react"));
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
const BACKEND_BASE_URL = "http://localhost:4000"; // <-- Adjust this to your backend URL
function TradeSchools() {
    const [tradeSchools, setTradeSchools] = (0, react_1.useState)([]);
    const [states, setStates] = (0, react_1.useState)([]);
    const [stateFilter, setStateFilter] = (0, react_1.useState)("");
    const [page, setPage] = (0, react_1.useState)(1);
    const [total, setTotal] = (0, react_1.useState)(0);
    const limit = 20;
    // Fetch distinct states from backend for filter dropdown
    (0, react_1.useEffect)(() => {
        async function fetchStates() {
            try {
                const res = await fetch(`${BACKEND_BASE_URL}/trade-schools/states`);
                console.log("States response status:", res.status);
                if (!res.ok)
                    throw new Error("Failed to fetch states");
                const data = await res.json();
                console.log("States data:", data);
                setStates(data);
            }
            catch (error) {
                console.error("Error fetching states:", error);
            }
        }
        fetchStates();
    }, []);
    // Fetch trade schools list with filters & pagination
    (0, react_1.useEffect)(() => {
        async function fetchTradeSchools() {
            try {
                const queryParams = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                });
                if (stateFilter) {
                    queryParams.append("state", stateFilter);
                }
                const res = await fetch(`${BACKEND_BASE_URL}/trade-schools?${queryParams.toString()}`);
                console.log("Trade schools response status:", res.status);
                if (!res.ok)
                    throw new Error("Failed to fetch trade schools");
                const data = await res.json();
                console.log("Trade schools data:", data);
                setTradeSchools(data.tradeSchools);
                setTotal(data.total);
            }
            catch (error) {
                console.error("Error fetching trade schools:", error);
            }
        }
        fetchTradeSchools();
    }, [stateFilter, page]);
    const totalPages = Math.ceil(total / limit);
    return (<AuthGuard_1.default>
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Trade Schools</h1>

      <div className="mb-6">
        <label htmlFor="stateFilter" className="mr-2 font-semibold">
          Filter by State:
        </label>
        <select id="stateFilter" className="border rounded px-2 py-1" value={stateFilter} onChange={(e) => {
            setStateFilter(e.target.value);
            setPage(1);
        }}>
          <option value="">All States</option>
          {states.map((state) => (<option key={state} value={state}>
              {state}
            </option>))}
        </select>
      </div>

      {tradeSchools.length === 0 ? (<p>No trade schools found.</p>) : (<ul className="space-y-4">
          {tradeSchools.map((school) => (<li key={school.id} className="border rounded p-4 shadow-sm hover:shadow-md transition">
              <h2 className="text-xl font-semibold">{school.title}</h2>
              <p className="text-gray-600">
                {school.city ? `${school.city}, ` : ""}
                {school.state}
              </p>
              {school.description && <p className="mt-2">{school.description}</p>}
              {school.website && (<a href={school.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-2 inline-block">
                  Visit Website
                </a>)}
            </li>))}
        </ul>)}

      {totalPages > 1 && (<div className="flex justify-center items-center mt-6 space-x-4">
          <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
            Next
          </button>
        </div>)}
    </div>
      </AuthGuard_1.default>);
}
