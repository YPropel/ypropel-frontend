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
exports.default = Home;
const react_1 = __importStar(require("react"));
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
function Home() {
    const [userProfile, setUserProfile] = (0, react_1.useState)(null);
    const imageInputRef = (0, react_1.useRef)(null);
    const videoInputRef = (0, react_1.useRef)(null);
    const [posts, setPosts] = (0, react_1.useState)([]);
    const [newContent, setNewContent] = (0, react_1.useState)("");
    const [newImageFile, setNewImageFile] = (0, react_1.useState)(null);
    const [newVideoFile, setNewVideoFile] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [userId, setUserId] = (0, react_1.useState)(0);
    const [userName, setUserName] = (0, react_1.useState)("");
    const [newComments, setNewComments] = (0, react_1.useState)({});
    const [expandedComments, setExpandedComments] = (0, react_1.useState)({});
    const [menuOpenPostId, setMenuOpenPostId] = (0, react_1.useState)(null);
    const [editingPostId, setEditingPostId] = (0, react_1.useState)(null);
    const [editFields, setEditFields] = (0, react_1.useState)({});
    const [editingCommentId, setEditingCommentId] = (0, react_1.useState)(null);
    const [editedCommentText, setEditedCommentText] = (0, react_1.useState)("");
    const getToken = () => {
        if (typeof window === "undefined")
            return "";
        const token = localStorage.getItem("token");
        return token || "";
    };
    (0, react_1.useEffect)(() => {
        if (typeof window !== "undefined") {
            const storedName = localStorage.getItem("userName") || "";
            setUserName(storedName);
            const storedId = parseInt(localStorage.getItem("userId") || "0");
            setUserId(storedId);
            async function fetchUserProfile(userId) {
                const token = getToken();
                const res = await fetch(`http://localhost:4000/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const profile = await res.json();
                    const formattedProfile = {
                        ...profile,
                        photoUrl: profile.photo_url,
                    };
                    setUserProfile(formattedProfile);
                }
            }
            if (storedId) {
                setUserId(storedId);
                fetchUserProfile(storedId);
            }
        }
        fetchPosts();
    }, []);
    async function fetchPosts() {
        try {
            const token = getToken();
            if (!token) {
                // Silently return if no token
                return;
            }
            const res = await fetch("http://localhost:4000/posts", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok)
                throw new Error("Failed to fetch posts");
            const data = await res.json();
            const postsWithComments = await Promise.all(data.map(async (post) => {
                const commentsRes = await fetch(`http://localhost:4000/posts/${post.id}/comments`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!commentsRes.ok)
                    throw new Error("Failed to fetch comments");
                const comments = await commentsRes.json();
                return { ...post, comments };
            }));
            setPosts(postsWithComments);
        }
        catch (error) {
            console.error("Error loading posts:", error);
        }
    }
    async function addPost() {
        if (!newContent.trim() && !newImageFile && !newVideoFile) {
            alert("You must add some text, an image, or a video.");
            return;
        }
        const token = getToken();
        if (!token) {
            // Silently return if no token
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("content", newContent);
            if (newImageFile)
                formData.append("image", newImageFile);
            if (newVideoFile)
                formData.append("video", newVideoFile);
            const res = await fetch("http://localhost:4000/posts", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok)
                throw new Error("Failed to create post");
            await fetchPosts();
            // Reset inputs
            setNewContent("");
            setNewImageFile(null);
            setNewVideoFile(null);
            if (imageInputRef.current)
                imageInputRef.current.value = "";
            if (videoInputRef.current)
                videoInputRef.current.value = "";
        }
        catch (error) {
            alert(`Error adding post: ${error.message}`);
        }
        finally {
            setLoading(false);
        }
    }
    async function deletePost(postId) {
        const token = getToken();
        if (!token)
            return;
        if (!window.confirm("Delete this post?"))
            return;
        try {
            const res = await fetch(`http://localhost:4000/posts/${postId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error("Failed to delete");
            setPosts((prev) => prev.filter((p) => p.id !== postId));
        }
        catch (error) {
            alert("Error deleting post");
        }
    }
    async function toggleFollow(postId) {
        const token = getToken();
        if (!token)
            return;
        try {
            const res = await fetch(`http://localhost:4000/posts/${postId}/follow`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, followed: data.followed } : p));
        }
        catch (err) {
            alert("Failed to follow/unfollow");
        }
    }
    async function toggleLike(postId) {
        const token = getToken();
        if (!token)
            return;
        try {
            const res = await fetch(`http://localhost:4000/posts/${postId}/like`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, liked: data.liked } : p)));
        }
        catch (err) {
            alert("Failed to like/unlike");
        }
    }
    async function sharePost(postId) {
        const token = getToken();
        if (!token)
            return;
        try {
            const res = await fetch(`http://localhost:4000/posts/${postId}/share`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error("Already shared");
            alert("Post shared successfully");
        }
        catch (err) {
            alert("You already shared this post.");
        }
    }
    function toggleComments(postId) {
        setExpandedComments((prev) => ({
            ...prev,
            [postId]: !prev[postId],
        }));
    }
    async function submitComment(postId) {
        const token = getToken();
        if (!token)
            return;
        const content = newComments[postId];
        if (!content)
            return;
        try {
            const res = await fetch(`http://localhost:4000/posts/${postId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            });
            if (!res.ok)
                throw new Error("Failed to comment");
            const newComment = await res.json();
            const fullComment = {
                ...newComment,
                userId: userId,
                userName: userName,
            };
            setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: [...p.comments, fullComment] } : p));
            setNewComments((prev) => ({ ...prev, [postId]: "" }));
        }
        catch (err) {
            alert("Failed to post comment");
        }
    }
    const saveEditedComment = async (postId, commentId) => {
        const token = getToken();
        if (!token)
            return;
        try {
            const res = await fetch(`http://localhost:4000/posts/${postId}/comments/${commentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: editedCommentText }),
            });
            if (!res.ok)
                throw new Error("Failed to update comment");
            const updatedComment = await res.json();
            setPosts((prev) => prev.map((post) => post.id === postId
                ? {
                    ...post,
                    comments: post.comments.map((comment) => comment.id === commentId
                        ? { ...comment, content: updatedComment.content }
                        : comment),
                }
                : post));
            setEditingCommentId(null);
            setEditedCommentText("");
        }
        catch (err) {
            alert("Failed to edit comment");
        }
    };
    async function saveEdit(postId) {
        const token = getToken();
        if (!token)
            return;
        const fields = editFields[postId];
        try {
            const res = await fetch(`http://localhost:4000/posts/${postId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(fields),
            });
            if (!res.ok)
                throw new Error("Failed to update post");
            setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, ...fields } : p));
            setEditingPostId(null);
        }
        catch (err) {
            alert("Failed to save post changes");
        }
    }
    function startEdit(post) {
        setEditFields((prev) => ({
            ...prev,
            [post.id]: { content: post.content },
        }));
        setEditingPostId(post.id);
        setMenuOpenPostId(null);
    }
    return (<AuthGuard_1.default>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {userProfile && (<div className="border border-gray-300 rounded-lg p-4 mb-4 bg-gray-50 shadow-sm">
            <div className="mb-4 flex items-center space-x-3">
              <img src={(localStorage.getItem("profilePhotoUrl") || userProfile.photoUrl || "").trim() !== ""
                ? localStorage.getItem("profilePhotoUrl") || userProfile.photoUrl
                : "/images/default-profile.png"} alt="User avatar" className="w-10 h-10 rounded-full object-cover" onError={(e) => {
                e.target.src = "/images/default-profile.png";
            }}/>
              <h2 className="text-3xl font-bold text-blue-900">
                Hi, {userProfile.name?.split(" ")[0]} 👋
              </h2>
            </div>
            <h1 className="text-lg text-green-600">Another Day, Another Opportunity 💼</h1>
          </div>)}

        <div className="border rounded p-4 bg-white shadow space-y-3">
          <textarea placeholder="Share something..." value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3} className="w-full p-2 border rounded" disabled={loading}/>

          <div className="border rounded p-4 bg-white shadow space-y-3">
            <div className="flex gap-4 items-center flex-wrap">
              <button onClick={() => imageInputRef.current?.click()} className="text-sm text-blue-700 underline">
                📷 Add Image
              </button>
              <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => setNewImageFile(e.target.files?.[0] || null)} className="hidden"/>

              <button onClick={() => videoInputRef.current?.click()} className="text-sm text-blue-700 underline">
                🎥 Add Video
              </button>
              <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => setNewVideoFile(e.target.files?.[0] || null)} className="hidden"/>
            </div>

            {/* Preview Image */}
            {newImageFile && (<div className="mt-3">
                <p className="text-xs text-gray-600 mb-1">Image Preview:</p>
                <img src={URL.createObjectURL(newImageFile)} alt="Preview" className="max-h-48 rounded shadow border"/>
              </div>)}

            {/* Preview Video */}
            {newVideoFile && (<div className="mt-3">
                <p className="text-xs text-gray-600 mb-1">Video Preview:</p>
                <video controls className="w-full max-h-64 rounded shadow border" src={URL.createObjectURL(newVideoFile)}>
                  Your browser does not support the video tag.
                </video>
              </div>)}
          </div>

          <button onClick={addPost} disabled={loading} className="bg-blue-900 text-white px-4 py-2 rounded">
            {loading ? "Posting..." : "Post"}
          </button>
        </div>

        {posts.map((post) => {
            const isExpanded = expandedComments[post.id];
            const commentsToShow = isExpanded ? post.comments : post.comments.slice(0, 2);
            const isEditing = editingPostId === post.id;
            return (<div key={post.id} className="bg-white rounded shadow p-4 space-y-3 relative">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{post.authorName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>

                {userId === post.authorId && (<div className="relative">
                    <button onClick={() => setMenuOpenPostId(menuOpenPostId === post.id ? null : post.id)} className="text-gray-600 text-xl font-bold">
                      ⋮
                    </button>
                    {menuOpenPostId === post.id && (<div className="absolute right-0 mt-2 w-28 bg-white shadow-lg border rounded text-sm z-20">
                        <button onClick={() => startEdit(post)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                          Edit ✏️
                        </button>
                        <button onClick={() => deletePost(post.id)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
                          Delete
                        </button>
                      </div>)}
                  </div>)}
              </div>

              {isEditing ? (<>
                  <textarea value={editFields[post.id].content} onChange={(e) => setEditFields((prev) => ({
                        ...prev,
                        [post.id]: { ...prev[post.id], content: e.target.value },
                    }))} rows={3} className="w-full p-2 border rounded"/>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(post.id)} className="bg-green-600 text-white px-3 py-1 rounded">
                      Save
                    </button>
                    <button onClick={() => setEditingPostId(null)} className="bg-gray-400 text-white px-3 py-1 rounded">
                      Cancel
                    </button>
                  </div>
                </>) : (<>
                  <p>{post.content}</p>

                  {post.imageUrl && (<img src={`http://localhost:4000${post.imageUrl}`} alt="Post image" className="max-w-full h-auto mt-2"/>)}

                  {post.videoUrl && (<video controls className="w-full mt-2">
                      <source src={`http://localhost:4000${post.videoUrl}`} type="video/mp4"/>
                      Your browser does not support the video tag.
                    </video>)}

                  <div className="flex gap-4 mt-2">
                    <button onClick={() => toggleFollow(post.id)} className={`text-sm ${post.followed ? "text-blue-600" : "text-gray-600"}`}>
                      {post.followed ? "Unfollow" : "Follow"}
                    </button>
                    <button onClick={() => toggleLike(post.id)} className={`text-sm ${post.liked ? "text-red-600" : "text-gray-600"}`}>
                      ❤️ {post.liked ? "Liked" : "Like"}
                    </button>
                    <button onClick={() => toggleComments(post.id)} className="text-sm text-gray-600">
                      💬 {isExpanded ? "Hide Comments" : "Comments"}
                    </button>
                    <button onClick={() => sharePost(post.id)} className="text-sm text-gray-600">
                      🔄 Share
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {commentsToShow.map((comment) => {
                        return (<div key={comment.id} className="text-sm border-t pt-2">
                          <strong>{comment.userName}</strong>:
                          {editingCommentId === comment.id ? (<>
                              <input value={editedCommentText} onChange={(e) => setEditedCommentText(e.target.value)} className="border p-1 ml-2 text-sm"/>
                              <button onClick={() => saveEditedComment(post.id, comment.id)} className="text-blue-600 ml-2 text-sm">
                                Save
                              </button>
                              <button onClick={() => setEditingCommentId(null)} className="text-gray-600 ml-2 text-sm">
                                Cancel
                              </button>
                            </>) : (<>
                              <span className="ml-1">{comment.content}</span>
                              {+comment.userId === +userId && (<button onClick={() => {
                                        setEditingCommentId(comment.id);
                                        setEditedCommentText(comment.content);
                                    }} className="text-xs text-blue-600 ml-2">
                                  Edit
                                </button>)}
                            </>)}
                        </div>);
                    })}

                    {post.comments.length > 2 && (<button onClick={() => toggleComments(post.id)} className="text-xs text-blue-600 mt-1">
                        {isExpanded ? "Show less" : "Show more"}
                      </button>)}
                    <div className="flex mt-2 gap-2">
                      <input type="text" value={newComments[post.id] || ""} onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))} placeholder="Add a comment..." className="flex-1 border rounded px-2 py-1 text-sm"/>
                      <button onClick={() => submitComment(post.id)} className="text-sm text-blue-600">
                        Post
                      </button>
                    </div>
                  </div>
                </>)}
            </div>);
        })}
      </div>
    </AuthGuard_1.default>);
}
