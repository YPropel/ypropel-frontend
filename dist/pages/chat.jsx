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
exports.default = ChatPage;
const react_1 = __importStar(require("react"));
const MembersList_1 = __importDefault(require("../components/MembersList"));
const ChatWindow_1 = __importDefault(require("../components/ChatWindow"));
function ChatPage() {
    const [otherUserId, setOtherUserId] = (0, react_1.useState)(null);
    const [recentChatMembers, setRecentChatMembers] = (0, react_1.useState)([]);
    const [otherMembers, setOtherMembers] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [unreadCounts, setUnreadCounts] = (0, react_1.useState)({});
    (0, react_1.useEffect)(() => {
        async function fetchMembers() {
            try {
                const token = localStorage.getItem("token");
                if (!token)
                    return;
                // Fetch combined recent + other members from backend
                const res = await fetch("http://localhost:4000/members/combined-list", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok)
                    throw new Error("Failed to fetch members");
                const data = await res.json();
                setRecentChatMembers(data.recentMembers);
                setOtherMembers(data.otherMembers);
                // Fetch unread counts by sender
                const resUnread = await fetch("http://localhost:4000/messages/unread-count-by-sender", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resUnread.ok)
                    throw new Error("Failed to fetch unread counts");
                const unreadData = await resUnread.json();
                setUnreadCounts(unreadData);
                // Auto-select first recent chat member if exists, else first other member
                if (data.recentMembers.length > 0) {
                    setOtherUserId(data.recentMembers[0].id);
                }
                else if (data.otherMembers.length > 0) {
                    setOtherUserId(data.otherMembers[0].id);
                }
            }
            catch (error) {
                console.error(error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchMembers();
    }, []);
    const handleMemberClick = (user) => {
        setOtherUserId(user.id);
    };
    if (loading)
        return <p className="p-4">Loading members...</p>;
    return (<div className="flex max-w-7xl mx-auto h-screen border rounded shadow">
      <div className="w-2/3 border-r overflow-auto" style={{ minHeight: "100vh" }}>
        {otherUserId ? (<ChatWindow_1.default otherUserId={otherUserId}/>) : (<div className="flex items-center justify-center h-full text-gray-500">
            Select a member to start chatting
          </div>)}
      </div>

      <div className="w-1/3 overflow-auto">
        <MembersList_1.default recentMembers={recentChatMembers} otherMembers={otherMembers} onMemberClick={handleMemberClick} selectedUserId={otherUserId} unreadCounts={unreadCounts}/>
      </div>
    </div>);
    (0, react_1.useEffect)(() => {
        const handleMessagesRead = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token)
                    return;
                const resUnread = await fetch("http://localhost:4000/messages/unread-count-by-sender", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resUnread.ok)
                    throw new Error("Failed to fetch unread counts");
                const unreadData = await resUnread.json();
                setUnreadCounts(unreadData);
            }
            catch (error) {
                console.error("Failed to refresh unread counts:", error);
            }
        };
        window.addEventListener("messagesRead", handleMessagesRead);
        return () => {
            window.removeEventListener("messagesRead", handleMessagesRead);
        };
    }, []);
}
