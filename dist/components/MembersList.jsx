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
exports.default = MembersList;
const react_1 = __importStar(require("react"));
const Avatar_1 = __importDefault(require("../components/Avatar"));
function MembersList({ onMemberClick, selectedUserId, }) {
    const [recentMembers, setRecentMembers] = (0, react_1.useState)([]);
    const [otherMembers, setOtherMembers] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)("");
    const [unreadCounts, setUnreadCounts] = (0, react_1.useState)({});
    (0, react_1.useEffect)(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }
        async function fetchMembersAndUnread() {
            try {
                // Fetch combined members
                const resMembers = await fetch("http://localhost:4000/members/combined-list", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resMembers.ok)
                    throw new Error("Failed to fetch members");
                const data = await resMembers.json();
                setRecentMembers(data.recentMembers);
                setOtherMembers(data.otherMembers);
                // Fetch unread counts
                const resUnread = await fetch("http://localhost:4000/messages/unread-count-by-sender", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resUnread.ok)
                    throw new Error("Failed to fetch unread counts");
                const unreadData = await resUnread.json();
                setUnreadCounts(unreadData);
            }
            catch (error) {
                console.error(error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchMembersAndUnread();
    }, []);
    // Filter function
    const filterMembers = (members) => members.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading)
        return <p>Loading members...</p>;
    return (<div>
      {/* Search Box */}
      <input type="text" placeholder="Search members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4 w-full px-3 py-2 border rounded"/>

      <h2 className="text-xl font-semibold mb-2">Recent Chats</h2>
      {filterMembers(recentMembers).length === 0 && <p>No recent chats.</p>}
      {filterMembers(recentMembers).map((user) => (<div key={user.id} className={`flex items-center justify-between mb-2 cursor-pointer hover:bg-gray-100 rounded p-1 ${selectedUserId === user.id ? "bg-blue-200" : ""}`} onClick={() => onMemberClick(user)} role="button" tabIndex={0} onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                    onMemberClick(user);
            }}>
          <div className="flex items-center">
            <Avatar_1.default name={user.name} photoUrl={user.photo_url} size={32}/>
            <span className="ml-2">{user.name}</span>
          </div>

          {/* Red badge for unread count */}
          {unreadCounts[user.id] > 0 && (<span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadCounts[user.id]}
            </span>)}
        </div>))}

      <h2 className="text-xl font-semibold mt-6 mb-2">All Members</h2>
      {filterMembers(otherMembers).length === 0 && <p>No other members found.</p>}
      {filterMembers(otherMembers).map((user) => (<div key={user.id} className={`flex items-center justify-between mb-2 cursor-pointer hover:bg-gray-100 rounded p-1 ${selectedUserId === user.id ? "bg-blue-200" : ""}`} onClick={() => onMemberClick(user)} role="button" tabIndex={0} onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                    onMemberClick(user);
            }}>
          <div className="flex items-center">
            <Avatar_1.default name={user.name} photoUrl={user.photo_url} size={32}/>
            <span className="ml-2">{user.name}</span>
          </div>

          {/* Red badge for unread count */}
          {unreadCounts[user.id] > 0 && (<span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadCounts[user.id]}
            </span>)}
        </div>))}
    </div>);
}
