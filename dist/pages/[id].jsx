"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArticleDetailPage;
//- page to display each article seperately in its own page
// so in frontend we click on the article box this page will open with the 
//right article content// /pages/articles/[id].tsx
const router_1 = require("next/router");
const react_1 = require("react");
function ArticleDetailPage() {
    const router = (0, router_1.useRouter)();
    const { id } = router.query;
    const [article, setArticle] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        if (!id)
            return;
        const fetchArticle = async () => {
            try {
                const res = await fetch(`http://localhost:4000/articles/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setArticle(data);
                }
            }
            catch (err) {
                console.error("Failed to load article:", err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);
    if (loading)
        return <p className="p-6">Loading...</p>;
    if (!article)
        return <p className="p-6">Article not found.</p>;
    return (<div className="max-w-4xl mx-auto px-4 py-8">
      {article.cover_image && (<img src={article.cover_image} alt={article.title} className="w-full h-64 object-cover rounded mb-6"/>)}

      <h1 className="text-3xl font-bold text-blue-900 mb-2">{article.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        Published on {new Date(article.published_at).toLocaleDateString()}
      </p>

      <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: article.content }}/>
    </div>);
}
