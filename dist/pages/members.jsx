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
exports.default = MembersDirectory;
const react_1 = __importStar(require("react"));
const Avatar_1 = __importDefault(require("../components/Avatar"));
const ChatWindow_1 = __importDefault(require("../components/ChatWindow"));
function MembersDirectory() {
    const [members, setMembers] = (0, react_1.useState)([]);
    const [filteredMembers, setFilteredMembers] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Filters state
    const [experienceFilter, setExperienceFilter] = (0, react_1.useState)("");
    const [majorFilter, setMajorFilter] = (0, react_1.useState)("");
    const [universityFilter, setUniversityFilter] = (0, react_1.useState)("");
    const [searchTerm, setSearchTerm] = (0, react_1.useState)("");
    // Chat modal state
    const [chatWithMember, setChatWithMember] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("You must be signed in to view members.");
            setLoading(false);
            return;
        }
        fetch("http://localhost:4000/users", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
            if (!res.ok) {
                throw new Error(`Failed to fetch members: ${res.status} ${res.statusText}`);
            }
            return res.json();
        })
            .then((data) => {
            setMembers(data);
            setFilteredMembers(data);
            setLoading(false);
        })
            .catch((err) => {
            console.error("Error fetching members:", err);
            setError(err.message);
            setLoading(false);
        });
    }, []);
    (0, react_1.useEffect)(() => {
        let filtered = members;
        if (experienceFilter)
            filtered = filtered.filter((m) => m.experience_level === experienceFilter);
        if (majorFilter)
            filtered = filtered.filter((m) => m.major === majorFilter);
        if (universityFilter)
            filtered = filtered.filter((m) => m.university === universityFilter);
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter((m) => m.name.toLowerCase().includes(lowerTerm) ||
                (m.skills && m.skills.toLowerCase().includes(lowerTerm)));
        }
        setFilteredMembers(filtered);
    }, [experienceFilter, majorFilter, universityFilter, searchTerm, members]);
    // Unique filter options
    const experienceOptions = Array.from(new Set(members.map((m) => m.experience_level).filter(Boolean)));
    const majorOptions = Array.from(new Set(members.map((m) => m.major).filter(Boolean)));
    const universityOptions = Array.from(new Set(members.map((m) => m.university).filter(Boolean)));
    if (loading)
        return <p className="p-6 text-center">Loading members...</p>;
    if (error)
        return (<p className="p-6 text-center text-red-600">{error}</p>);
    return (<div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Members Directory</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input type="text" placeholder="Search by name or skills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border p-2 rounded flex-grow min-w-[200px]"/>
        <select value={experienceFilter} onChange={(e) => setExperienceFilter(e.target.value)} className="border p-2 rounded">
          <option value="">All Experience Levels</option>
          {experienceOptions.map((level) => (<option key={level} value={level}>
              {level}
            </option>))}
        </select>
        <select value={majorFilter} onChange={(e) => setMajorFilter(e.target.value)} className="border p-2 rounded">
          <option value="">All Majors</option>
          {majorOptions.map((major) => (<option key={major} value={major}>
              {major}
            </option>))}
        </select>
        <select value={universityFilter} onChange={(e) => setUniversityFilter(e.target.value)} className="border p-2 rounded">
          <option value="">All Universities</option>
          {universityOptions.map((uni) => (<option key={uni} value={uni}>
              {uni}
            </option>))}
        </select>
      </div>

      {/* Members list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMembers.length > 0 ? (filteredMembers.map((member) => (<div key={member.id} className="border rounded p-4 flex items-center gap-4 shadow">
              <Avatar_1.default name={member.name} photoUrl={member.photo_url} size={80}/>

              <div className="flex-grow">
                <h2 className="text-xl font-semibold">{member.name}</h2>
                {member.title && member.title.trim() !== "" && (<p className="text-gray-700">{member.title}</p>)}
                {(member.experience_level || member.major || member.university) && (<p className="text-sm text-gray-600">
                    {[member.experience_level, member.major, member.university]
                    .filter((val) => val && val.trim() !== "")
                    .join(" | ")}
                  </p>)}
                {member.skills && member.skills.trim() !== "" && (<p className="text-sm mt-1">
                    <strong>Skills:</strong> {member.skills}
                  </p>)}
              </div>

              <button onClick={() => setChatWithMember(member)} className="ml-auto bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                Message
              </button>
            </div>))) : (<p className="text-center col-span-full text-gray-600">
            No members found.
          </p>)}
      </div>

      {/* Chat modal */}
      {chatWithMember && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-3xl max-h-[80vh] overflow-auto relative">
            <button onClick={() => setChatWithMember(null)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold" aria-label="Close chat">
              &times;
            </button>
            <ChatWindow_1.default otherUserId={chatWithMember.id}/>
          </div>
        </div>)}
    </div>);
}
