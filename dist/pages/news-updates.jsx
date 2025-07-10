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
exports.default = NewsUpdates;
const react_1 = __importStar(require("react"));
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
function NewsUpdates() {
    const [posts, setPosts] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch("http://localhost:4000/news");
                const data = await res.json();
                setPosts(data);
            }
            catch (err) {
                console.error("Failed to fetch news", err);
            }
        };
        fetchNews();
    }, []);
    return (<AuthGuard_1.default>
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Latest News & Updates</h1>

      <div className="space-y-6">
        {posts.length === 0 ? (<p className="text-gray-600">No news updates available at the moment.</p>) : (posts.map(({ id, title, content, image_url, created_at }) => (<div key={id} className="border rounded p-4 shadow bg-white">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">{title}</h2>
              {image_url && (<img src={image_url} alt={title} className="w-full max-h-64 object-cover rounded mb-3"/>)}
              <p className="mb-2">{content}</p>
              <p className="text-sm text-gray-600">
                Posted on {new Date(created_at).toLocaleDateString()}
              </p>
            </div>)))}
      </div>
    </div>
    </AuthGuard_1.default>);
}
