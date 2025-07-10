"use strict";
//-- This page is the backend of NewsAdmin and all other backend components
//  which is the admin dashboord where admin 
// 1- can post news updates to the frontend News and Updates section
//it covers Submit news post and delete news post 
//Note: the News and update delete route for admin is in the ypropel-backend index.tsx
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
exports.default = AdminDashboard;
const react_1 = __importStar(require("react"));
const router_1 = require("next/router");
const jwt_decode_1 = require("jwt-decode");
const dynamic_1 = __importDefault(require("next/dynamic"));
const NewsAdmin = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require("@/components/admin/NewsAdmin"))), { ssr: false });
//--- Open admin dashboard if user has "admin" role
function AdminDashboard() {
    const router = (0, router_1.useRouter)();
    const [isAdmin, setIsAdmin] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token) {
            console.warn("❌ No token found.");
            setIsAdmin(false);
            router.push("/unauthorized");
            return;
        }
        try {
            const decoded = (0, jwt_decode_1.jwtDecode)(token);
            console.log("🔍 Decoded Token:", decoded);
            console.log("🔐 Role from localStorage:", role);
            const isAdminValue = decoded.is_admin === true ||
                decoded.is_admin === "true" ||
                decoded.is_admin === 1 ||
                String(decoded.is_admin).toLowerCase() === "true" ||
                role === "admin";
            if (isAdminValue) {
                setIsAdmin(true);
            }
            else {
                console.warn("❌ Not admin user");
                setIsAdmin(false);
                router.push("/unauthorized");
            }
        }
        catch (err) {
            console.error("❌ Token decode error", err);
            setIsAdmin(false);
            router.push("/unauthorized");
        }
    }, [router]);
    if (isAdmin === null)
        return null;
    if (!isAdmin)
        return null;
    return (<div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🛠️ Admin Dashboard</h1>
      <section>
        <h2 className="text-xl font-semibold mb-2">📰 Manage News Posts</h2>
        <NewsAdmin />
      </section>
    </div>);
}
