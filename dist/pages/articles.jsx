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
exports.default = ArticlesPage;
const react_1 = __importStar(require("react"));
const router_1 = require("next/router");
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
function ArticlesPage() {
    const [articles, setArticles] = (0, react_1.useState)([]);
    const router = (0, router_1.useRouter)();
    (0, react_1.useEffect)(() => {
        const fetchArticles = async () => {
            try {
                const res = await fetch("http://localhost:4000/articles");
                const data = await res.json();
                setArticles(data);
            }
            catch (err) {
                console.error("Failed to fetch articles:", err);
            }
        };
        fetchArticles();
    }, []);
    const getExcerpt = (htmlContent, maxLength = 120) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || tempDiv.innerText || "";
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength) + "...";
    };
    return (<AuthGuard_1.default>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">📚 Articles</h1>

      {articles.length === 0 ? (<p className="text-gray-500">No articles available.</p>) : (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {articles.map((article) => (<div key={article.id} className="border rounded shadow hover:shadow-lg cursor-pointer bg-white flex flex-col" onClick={() => router.push(`/articles/${article.id}`)}>
              {article.cover_image && (<img src={article.cover_image} alt={article.title} className="w-full h-48 object-cover rounded-t"/>)}
              <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">
                  {article.title}
                </h2>
                <p className="text-gray-600 text-sm flex-grow">
                  {getExcerpt(article.content)}
                </p>
                <span className="mt-3 text-green-600 font-semibold text-sm">
                  Read More →
                </span>
              </div>
            </div>))}
        </div>)}
    </div>
    </AuthGuard_1.default>);
}
