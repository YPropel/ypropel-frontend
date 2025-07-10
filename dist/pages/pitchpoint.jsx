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
exports.default = VideosList;
const react_1 = __importStar(require("react"));
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
function VideosList() {
    const [videos, setVideos] = (0, react_1.useState)([]);
    const [token, setToken] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        const storedToken = localStorage.getItem("token") || "";
        setToken(storedToken);
        fetchVideos(storedToken);
    }, []);
    async function fetchVideos(token) {
        try {
            const res = await fetch("http://localhost:4000/api/videos", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const videosWithFlags = data.map((v) => ({
                id: v.id,
                title: v.title,
                description: v.description,
                video_url: v.video_url,
                likes: v.likes || 0,
                follows: v.follows || 0,
                shares: v.shares || 0,
                likedByUser: false,
                followedByUser: false,
            }));
            setVideos(videosWithFlags);
        }
        catch (error) {
            console.error("Error fetching videos:", error);
        }
    }
    async function toggleLike(videoId, liked) {
        try {
            const res = await fetch(`http://localhost:4000/api/videos/${videoId}/like`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ liked: !liked }),
            });
            const data = await res.json();
            setVideos((prev) => prev.map((video) => video.id === videoId
                ? { ...video, likes: data.likes, likedByUser: data.likedByUser }
                : video));
        }
        catch (error) {
            console.error("Error toggling like:", error);
        }
    }
    async function toggleFollow(videoId, followed) {
        try {
            const res = await fetch(`http://localhost:4000/api/videos/${videoId}/follow`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ followed: !followed }),
            });
            const data = await res.json();
            setVideos((prev) => prev.map((video) => video.id === videoId
                ? { ...video, follows: data.follows, followedByUser: data.followedByUser }
                : video));
        }
        catch (error) {
            console.error("Error toggling follow:", error);
        }
    }
    async function handleShare(videoId) {
        try {
            const res = await fetch(`http://localhost:4000/api/videos/${videoId}/share`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setVideos((prev) => prev.map((video) => video.id === videoId ? { ...video, shares: data.shares } : video));
            alert("Thanks for sharing!");
        }
        catch (error) {
            console.error("Error sharing video:", error);
        }
    }
    return (<AuthGuard_1.default>
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Videos</h1>
      <div className="flex flex-col gap-6">
        {videos.map((video) => (<div key={video.id} className="border rounded p-4 shadow-sm w-full max-w-md mx-auto flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2 text-center">{video.title}</h2>
            {video.description && (<p className="mb-3 text-center text-gray-700">{video.description}</p>)}
            <video src={video.video_url} controls className="w-80 h-auto rounded mb-4"/>
            <div className="flex justify-center space-x-4 text-gray-700 w-full">
              <button onClick={() => toggleLike(video.id, video.likedByUser)} className={`cursor-pointer px-4 py-1 rounded text-sm transition-colors ${video.likedByUser
                ? "bg-green-700 text-white"
                : "bg-green-200 text-green-800 hover:bg-green-300"}`}>
                👍 Like ({video.likes})
              </button>
              <button onClick={() => toggleFollow(video.id, video.followedByUser)} className={`cursor-pointer px-4 py-1 rounded text-sm transition-colors ${video.followedByUser
                ? "bg-green-700 text-white"
                : "bg-green-200 text-green-800 hover:bg-green-300"}`}>
                ⭐ Follow ({video.follows})
              </button>
              <button onClick={() => handleShare(video.id)} className="cursor-pointer px-4 py-1 rounded text-sm bg-green-400 text-green-900 hover:bg-green-500 transition-colors">
                🔄 Share ({video.shares})
              </button>
            </div>
          </div>))}
      </div>
    </div>
    </AuthGuard_1.default>);
}
