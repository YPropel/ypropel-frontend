import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AuthGuard from "../components/AuthGuard";
import { apiFetch } from "../apiClient"; 


type CircleMessage = {
  sender?: string;
  message: string;
};


type DiscussionComment = {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
};

type DiscussionTopic = {
  id: number;
  author: string;
  topic: string;
  liked: boolean;
  followed: boolean;
  shares: number;
  likes: number;
  upvoted: boolean; 
  upvotes: number;
  comments: DiscussionComment[];
};


type StudyCircle = {
  id: number;
  name: string;
  isPublic: boolean;
  members: string[];
  created_by?: number;  // or just number if always present
};

export default function DiscussionBoard() {
  const [discussionTopics, setDiscussionTopics] = useState<DiscussionTopic[]>([]);
  const [studyCircles, setStudyCircles] = useState<StudyCircle[]>([]);

  const [activeTab, setActiveTab] = useState<"discussion" | "studyCircle">("discussion");
  const [newCommentText, setNewCommentText] = useState<{ [key: number]: string }>({});
  const [showCreateCircleForm, setShowCreateCircleForm] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleIsPublic, setNewCircleIsPublic] = useState(true);
  const [newCircleMembers, setNewCircleMembers] = useState<string>("");
  const [newTopic, setNewTopic] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
const [editTopicId, setEditTopicId] = useState<number | null>(null);
const [editText, setEditText] = useState<string>("");
const [collapsedComments, setCollapsedComments] = useState<{ [key: number]: boolean }>({});
const [userEmail, setUserEmail] = useState<string>("");
const [activeChatCircle, setActiveChatCircle] = useState<number | null>(null);
const [circleMessages, setCircleMessages] = useState<{ [circleId: number]: CircleMessage[] }>({});
const [newMessage, setNewMessage] = useState<string>("");
const router = useRouter(); 
const [userSearchQuery, setUserSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<{ id: number; name: string; email: string }[]>([]);
const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<{ id: number; name: string; email: string }[]>([]);
const [showDropdownForCircle, setShowDropdownForCircle] = useState<number | null>(null);
const [userId, setUserId] = useState<number | null>(null);
const [searchQuery, setSearchQuery] = useState("");

//new 1
const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});

const [editCommentText, setEditCommentText] = useState<{ [key: number]: string }>({});
const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
//--New 2

//---delete and edit discussion-topics comment components----




  const toggleLike = async (id: number) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await apiFetch(`/discussion_topics/${id}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setDiscussionTopics((prev) =>
        prev.map((topic) =>
          topic.id === id
            ? {
                ...topic,
                liked: !topic.liked,
                likes: topic.liked ? topic.likes - 1 : topic.likes + 1,
              }
            : topic
        )
      );
    } else {
      console.error("Failed to toggle like");
    }
  } catch (err) {
    console.error("Error liking discussion:", err);
  }
};


  
// --------✅ Fetch data from backend on mount---------------
useEffect(() => {
  const fetchUserAndThenData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const userRes = await apiFetch("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userRes.ok) {
        const user = await userRes.json();
        setUserEmail(user.email);
        setUserId(user.id);

        // ✅ Only fetch circles *after* userId/userEmail are available
        await fetchStudyCircles(user.id, user.email);

        const discussionRes = await apiFetch("/discussion_topics", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (discussionRes.ok) {
          const discussions = await discussionRes.json();
          console.log("Discussion IDs after posting:", discussions.map((d: any) => d.id)); // ✅ here

          setDiscussionTopics(
  discussions.map((d: any) => ({
    id: d.id,
    author: d.author,
    topic: d.topic,
    liked: d.liked ?? false,
    followed: d.followed ?? false,
    shares: d.shares || 0,
    likes: d.likes || 0,
    upvotes: d.upvotes || 0,
    upvoted: d.upvoted || false,
    comments: (d.comments || []).map((c: any, idx: number): DiscussionComment => ({
    id: c.id ?? idx,
    userId: c.user_id,         // Note: from DB, field is user_id
    userName: c.user_name,     // matches the alias in query
    content: c.content,
    createdAt: c.created_at,
    })),

  }))
);

        }
      }

      const params = new URLSearchParams(window.location.search);
      setActiveTab(params.get("tab") === "studyCircle" ? "studyCircle" : "discussion");
    } catch (err) {
      console.error("❌ Failed to load initial data:", err);
    }
  };

  fetchUserAndThenData();
}, []);


//----------function to send message in chat inside circles----
const sendMessageToCircle = async (circleId: number) => {
  console.log("🟢 sendMessageToCircle called", circleId, newMessage);

  if (!newMessage.trim()) return;
  const token = localStorage.getItem("token");
  if (!token) return;
  console.log("Sending message:", newMessage);
  const res = await apiFetch(`/study-circles/${circleId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message: newMessage }),
  });

  if (res.ok) {
    const savedMessage = await res.json(); // <-- Get the full message object

    setCircleMessages((prev) => ({
      ...prev,
      [circleId]: [...(prev[circleId] || []), savedMessage], // Save full object, not just text
    }));

    setNewMessage("");
  } else {
    alert("Failed to send message.");
  }
};


//----------------Useeffect fetch end---------------------
 const toggleJoinCircle = async (circleId: number) => {
  const token = localStorage.getItem("token");
  if (!token || !userEmail) return; // ✅ check userEmail too

  try {
    const res = await apiFetch(`/study-circles/${circleId}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const { joined } = await res.json();

      // ✅ Use actual email instead of placeholder
      setStudyCircles(prev =>
        prev.map(circle =>
          circle.id === circleId
            ? {
                ...circle,
                members: joined
                  ? [...circle.members, userEmail]
                  : circle.members.filter((m) => m !== userEmail),
              }
            : circle
        )
      );
    } else {
      alert("Failed to update membership");
    }
  } catch (err) {
    console.error("Error joining/leaving circle:", err);
  }
};


 const toggleFollow = async (id: number) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await apiFetch(`/discussion_topics/${id}/follow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setDiscussionTopics(prev =>
        prev.map(topic =>
          topic.id === id
            ? {
                ...topic,
                followed: data.followed,
              }
            : topic
        )
      );
    }
  } catch (error) {
    console.error("Error following topic:", error);
  }
};
//---Toggle upvote
const toggleUpvote = async (id: number) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await apiFetch(`/discussion_topics/${id}/upvote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    const { upvoted } = await res.json();
    setDiscussionTopics((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              upvoted,
              upvotes: upvoted ? t.upvotes + 1 : t.upvotes - 1,
            }
          : t
      )
    );
  }
};

//-------------
const toggleComments = (topicId: number) => {
  setShowComments(prev => ({ ...prev, [topicId]: !prev[topicId] }));
};

const handleAddComment = async (discussionId: number) => {
  const content = newCommentText[discussionId]?.trim();
  const token = localStorage.getItem("token");
  if (!content || !token) return;

  const res = await apiFetch(`/discussion_topics/${discussionId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (res.ok) {
    const newComment = await res.json();
    setDiscussionTopics(prev =>
      prev.map(topic =>
        topic.id === discussionId
          ? { ...topic, comments: [...topic.comments, newComment] }
          : topic
      )
    );
    setNewCommentText(prev => ({ ...prev, [discussionId]: "" }));
  } else {
    alert("Failed to post comment.");
  }
};

//-----------Edit \delete comments -----


//------
  const shareTopic = (id: number) => {
    setDiscussionTopics(prev =>
      prev.map(topic =>
        topic.id === id ? { ...topic, shares: topic.shares + 1 } : topic
      )
    );
  };

 const addNewTopic = async () => {
  if (!newTopic.trim()) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await apiFetch("/discussion_topics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ topic: newTopic }),
  });

  if (res.ok) {
    // Re-fetch all topics so likes/follows/comments are correct
    const discussionRes = await apiFetch("/discussion_topics", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!discussionRes.ok) {
      const text = await discussionRes.text();
      throw new Error(`Failed to reload discussions: ${discussionRes.status} ${text}`);
    }

    const discussions = await discussionRes.json();
    setDiscussionTopics(
      discussions.map((d: any) => ({
        id: d.id,
        author: d.author,
        topic: d.topic,
        liked: d.liked || false,
        followed: d.followed || false,
        shares: d.shares || 0,
        likes: d.likes || 0,
        upvotes: d.upvotes || 0,      // ✅ include this
    upvoted: d.upvoted || false,
        comments: d.comments || [],
      }))
    );

    setNewTopic("");
  } else {
    alert("Failed to post discussion topic.");
  }
};

//----------------------

  const handleCommentSubmit = async (discussionId: number) => {
  const DiscussionComment = newCommentText[discussionId];
  if (!DiscussionComment?.trim()) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await apiFetch(`/discussion_topics/${discussionId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content: DiscussionComment }),
  });

  if (res.ok) {
    const newComment = await res.json();
    setDiscussionTopics(prev =>
      prev.map(topic =>
        topic.id === discussionId
          ? { ...topic, comments: [...topic.comments, newComment] }
          : topic
      )
    );
    setNewCommentText(prev => ({ ...prev, [discussionId]: "" }));
  } else {
    alert("Failed to post comment.");
  }
};
//-------Dete and edit comment---

const handleDeleteComment = async (topicId: number, commentId: number) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await apiFetch(`/discussion_topics/comments/${commentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    setDiscussionTopics((prev) =>
      prev.map((topic) =>
        topic.id === topicId
          ? { ...topic, comments: topic.comments.filter((c) => c.id !== commentId) }
          : topic
        
          
      )
    );
  }
};

const handleSaveEditedComment = async (topicId: number, commentId: number) => {
  const token = localStorage.getItem("token");
  const newText = editCommentText[commentId];
  if (!token || !newText?.trim()) return;

  const res = await apiFetch(`/discussion_topics/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content: newText }),
  });

  if (res.ok) {
    setDiscussionTopics((prev) =>
      prev.map((topic) =>
        
        topic.id === topicId
          ? {
              ...topic,
              comments: topic.comments.map((c) =>
                c.id === commentId ? { ...c, content: newText } : c
              ),
            }
          : topic
      )
    );
    setEditingCommentId(null);
  }
};

//----------

  //-------create new circle of study-----
  const handleCreateCircle = async () => {
  if (!newCircleName.trim()) {
    alert("Please enter a study circle name.");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token || !userEmail) return;

  try {
    const memberList = newCircleMembers
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    // ✅ Ensure the creator (you) is included
    if (!memberList.includes(userEmail)) {
      memberList.push(userEmail);
    }

    const res = await apiFetch("/study-circles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newCircleName.trim(),
        isPublic: newCircleIsPublic,
        members: memberList,
      }),
    });
console.log("🔍 Create circle response status:", res.status);
    if (!res.ok) {
     
      const text = await res.text();
      throw new Error(`Failed to create circle: ${res.status} ${text}`);
    }

    // ✅ Refresh circles
    if (userId && userEmail) {
    await fetchStudyCircles(userId, userEmail);
    }
   
    setShowCreateCircleForm(false);
    setNewCircleName("");
    setNewCircleIsPublic(true);
    setNewCircleMembers("");
  } catch (err) {
    console.error("Error creating circle:", err);
    alert("Failed to create study circle.");
  }
};


//-------- Render chat box if activeChatCircle is set-----------

{activeChatCircle && (
  <div className="mt-6 border rounded bg-white p-4 shadow">
    <h3 className="text-lg font-semibold text-blue-900 mb-2">
      Chat in Circle #{activeChatCircle}
    </h3>
    <div className="h-40 overflow-y-auto border p-2 mb-3 bg-gray-50 text-sm rounded">
      {(circleMessages[activeChatCircle] || []).map((msg, idx) => (
        <div key={idx} className="mb-1">
          <span className="font-semibold">{msg.sender || "You"}:</span> {msg.message}
        </div>
      ))}
    </div>
    <div className="flex space-x-2">
      <input
        type="text"
        className="flex-grow p-2 border rounded"
        placeholder="Type your message..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <p>Debug: activeChatCircle is {String(activeChatCircle)}</p>

      <button
        //onClick={() => sendMessageToCircle(activeChatCircle)}
        onClick={() => alert("Send clicked")}

        className="bg-blue-900 text-white px-4 py-1 rounded hover:bg-blue-800"
      >
        Send
      </button>
    </div>
  </div>
)}
//-----------Search members to add to cirlce---------------
const searchUsers = async () => {
  if (!userSearchQuery.trim()) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await apiFetch(`/users/search?query=${encodeURIComponent(userSearchQuery)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    const data = await res.json();
    setSearchResults(data);
  } else {
    alert("Failed to search users.");
  }
};


//-----------------------------------------
//---add drop down box to select members to join circle----
const openAddMemberDropdown = (circleId: number) => {
  setShowDropdownForCircle(circleId);
  setSearchQuery("");
  setSearchResults([]);
};

const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const query = e.target.value;
  setSearchQuery(query);

  if (!query.trim()) return setSearchResults([]);

  const token = localStorage.getItem("token");
  const res = await apiFetch(`/users/search?query=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    const results = await res.json();
    setSearchResults(results);
  }
};

const handleAddMember = async (userId: number, circleId: number) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  console.log("Adding user", userId, "to circle", circleId);

  const res = await apiFetch(`/study-circles/${circleId}/add-member`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });

  if (res.ok) {
    alert("Member added!");
    setShowDropdownForCircle(null);
    if (userId && userEmail) {
    await fetchStudyCircles(userId, userEmail); // ✅ Refresh circles so member list updates
    }
  } else {
    alert("Failed to add member.");
  }
};

// 🔁 Helper function to refresh study circles and update UI
// 🔁 Helper function to refresh study circles and update UI
  const fetchStudyCircles = async (userId: number, userEmail: string) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await apiFetch("/study-circles", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    const circles = await res.json();

    setStudyCircles(
      circles.map((c: any) => {
        const base = {
          id: c.id,
          name: c.name,
          isPublic: c.is_public,
          members: Array.isArray(c.members) ? c.members : [],
          created_by: c.created_by ?? userId,
        };

        if (!base.members.includes(userEmail) && base.created_by === userId && userEmail) {
          base.members.push(userEmail);
        }

        return base;
      })
    );
  } else {
    console.error("❌ Failed to refresh study circles");
  }
};

//--------function to delete circles by owner----
const handleDeleteCircle = async (circleId: number) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const confirmed = window.confirm("Are you sure you want to delete this circle?");
  if (!confirmed) return;

  try {
    const res = await apiFetch(`/study-circles/${circleId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setStudyCircles(prev => prev.filter(circle => circle.id !== circleId));
    } else {
      const text = await res.text();
      throw new Error(`Failed to delete circle: ${res.status} ${text}`);
    }
  } catch (err) {
    console.error("Error deleting circle:", err);
    alert("Failed to delete circle.");
  }
};


//------------------------------------

  //----------Delete discussion topic-------
  const handleDeleteTopic = async (id: number) => {
   
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await apiFetch(`/discussion_topics/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      // Remove the topic from UI
      setDiscussionTopics(prev => prev.filter(topic => topic.id !== id));
    } else {
      alert("Failed to delete topic");
    }
  } catch (error) {
    console.error("Error deleting topic:", error);
    alert("An error occurred while deleting the topic.");
  }
};

//---- Edit and save topic-------
const saveEditedTopic = async (id: number, updatedText: string) => {
  const token = localStorage.getItem("token");
  if (!token || !updatedText.trim()) return;

  try {
    const res = await apiFetch(`/discussion_topics/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic: updatedText }),
    });

    if (res.ok) {
      setDiscussionTopics(prev =>
        prev.map(topic =>
          topic.id === id ? { ...topic, topic: updatedText } : topic
        )
      );
      setEditTopicId(null);
      setEditText("");
    } else {
      alert("Failed to update topic.");
    }
  } catch (err) {
    console.error("Error updating topic:", err);
    alert("An error occurred while updating the topic.");
  }
};

//------------------------------
const topTopics = [...discussionTopics].sort((a, b) => b.likes - a.likes).slice(0, 5);

//------------------------------

//-----------

//----------
  return (
     <AuthGuard>
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">Discussion Board & Study Circle</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
          <button
            className={`py-2 px-6 font-semibold ${
              activeTab === "discussion"
                ? "border-b-2 border-blue-900 text-blue-900"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("discussion")}
          >
            Discussion Topics
          </button>
          <button
            className={`py-2 px-6 font-semibold ${
              activeTab === "studyCircle"
                ? "border-b-2 border-blue-900 text-blue-900"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("studyCircle")}
          >
            Study Circle
          </button>
        </div>

        {/* Discussion Tab */}
        {activeTab === "discussion" && (
          <>
            <div className="mb-6">
              <textarea
                className="w-full p-3 border rounded resize-none"
                rows={3}
                placeholder="Start a new discussion topic..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
              />
              <button
                onClick={addNewTopic}
                className="mt-2 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                Add Topic
              </button>
            </div>



            <div className="space-y-4">
          {discussionTopics.map(({ id, author, topic, liked, followed, shares, likes, comments, upvoted, upvotes }) => (
  <div key={id} className="border rounded p-4 shadow bg-white relative">

    {/* 3-Dots Menu */}
    <div className="absolute right-2 top-2">
      <button
        onClick={() => setMenuOpenId((prev) => (prev === id ? null : id))}
        className="text-gray-600 hover:text-gray-900"
      >
        ⋮
      </button>

      {menuOpenId === id && (
        <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-20">
          <button
            onClick={() => {
              setEditTopicId(id);
              setEditText(topic);
              setMenuOpenId(null);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            onClick={() => {
              handleDeleteTopic(id);
              setMenuOpenId(null);
            }}
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
          >
            Delete
          </button>
        </div>
      )}
    </div>

    {/* Author */}
    <p className="font-semibold text-blue-900 mb-1">{author}</p>

   {/* Topic Content or Editing */}
{editTopicId === id ? (
  <>
    <textarea
      className="w-full border rounded p-2 mb-2"
      rows={2}
      value={editText}
      onChange={(e) => setEditText(e.target.value)}
    />
    <button
      className="bg-blue-900 text-white px-3 py-1 rounded mr-2"
      onClick={() => saveEditedTopic(id, editText)}
    >
      Save
    </button>
    <button
      className="text-gray-600"
      onClick={() => setEditTopicId(null)}
    >
      Cancel
    </button>
  </>
) : (
  <>
    
    <p className="mb-4 whitespace-pre-wrap">{topic}</p>
  </>
)}


    

    <div className="flex space-x-6 text-sm text-gray-600 mb-2">
      <button
        onClick={() => toggleLike(id)}
        className={`hover:underline ${liked ? "text-blue-900 font-semibold" : ""}`}
      >
        {liked ? "Unlike" : "Like"} ({likes})
      </button>
      <button
        onClick={() => toggleFollow(id)}
        className={`hover:underline ${followed ? "text-blue-900 font-semibold" : ""}`}
      >
        {followed ? "Following" : "Follow"}
      </button>
      <button onClick={() => shareTopic(id)} className="hover:underline">
        Share ({shares})
      </button>

      <button
    onClick={() => toggleUpvote(id)}
    className={`hover:underline ${upvoted ? "text-green-700 font-semibold" : ""}`}
  >
    {upvoted ? "Remove Upvote" : "Upvote"} ({upvotes})
  </button>  
    </div>

    {/* ✅ Comment Input -----Comment Textbox to Add comment on topics------ */}
    <div className="mt-2 space-y-2">
      <textarea
        rows={2}
        className="w-full p-2 border rounded text-sm"
        placeholder="Write a comment..."
        value={newCommentText[id] || ""}
        onChange={(e) =>
          setNewCommentText((prev) => ({ ...prev, [id]: e.target.value }))
        }
      />
      <button
        onClick={() => handleCommentSubmit(id)}
        className="bg-blue-900 text-white px-3 py-1 rounded text-sm"
      >
        Comment
      </button>
    </div>

{/*------ ✅ Toggle Show/Hide (collapse) Comments -----   this line must starts after the above closed div otherwise it won't be under the post box*/}
<button
  className="text-xs text-blue-700 mt-1"
  onClick={() => toggleComments(id)}
>
  {showComments[id] ? "Hide Comments" : "Show Comments"}
</button>
{/* ✅ Comment List + Add + Edit/Delete */}
{showComments[id] && (
  <>
    <div className="mt-3 space-y-1 text-sm">
  {comments.map((comment) => (
  <div key={comment.id}>
    <span>{comment.userName}</span>: {comment.content}
  {collapsedComments[comment.id] ? (
    <>
      <span className="text-gray-600 italic">(collapsed)</span>
      <button
        onClick={() =>
          setCollapsedComments((prev) => ({ ...prev, [comment.id]: false }))
        }
        className="ml-2 text-xs text-blue-700 hover:underline"
      >
        Show
      </button>
    </>
  ) : editingCommentId === comment.id ? (
    <>
      <textarea
        className="border p-1 mt-1 w-full text-sm"
        value={editCommentText[comment.id] || ""}
        onChange={(e) =>
          setEditCommentText((prev) => ({
            ...prev,
            [comment.id]: e.target.value,
          }))
        }
      />
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => handleSaveEditedComment(id, comment.id)}
          className="text-blue-700 hover:underline text-xs"
        >
          Save
        </button>
        <button
          onClick={() => setEditingCommentId(null)}
          className="text-gray-500 hover:underline text-xs"
        >
          Cancel
        </button>
      </div>
    </>
  ) : (
    <>
      {comment.content}
      <div className="absolute right-0 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onClick={() =>
            setCollapsedComments((prev) => ({ ...prev, [comment.id]: true }))
          }
          className="text-gray-400 hover:underline text-xs"
        >
          Collapse
        </button>
        {comment.userId === userId && (
          <>
            <button
              onClick={() => {
                setEditingCommentId(comment.id);
                setEditCommentText((prev) => ({
                  ...prev,
                  [comment.id]: comment.content,
                }));
              }}
              className="text-blue-600 hover:underline text-xs"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteComment(id, comment.id)}
              className="text-red-600 hover:underline text-xs"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </>
  )}
</div>

  ))}
</div>
  </>
)}
{/* ----------End of Show\hide (collapse) button for comment section -------------- */}
 
  </div>
))}
  </div>
   </>
 )}

        {/* Study Circles Tab */}
        {activeTab === "studyCircle" && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-blue-900">Your Study Circles</h2>
              <button
                onClick={() => setShowCreateCircleForm(!showCreateCircleForm)}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                {showCreateCircleForm ? "Cancel" : "Create New Circle"}
              </button>
            </div>
          


            {showCreateCircleForm && (
              <div className="border rounded p-4 bg-white mb-6 shadow space-y-4">
                <input
                  type="text"
                  placeholder="Study Circle Name"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <div>
                  <label className="mr-4">
                    <input
                      type="radio"
                      name="privacy"
                      checked={newCircleIsPublic}
                      onChange={() => setNewCircleIsPublic(true)}
                      className="mr-1"
                    />
                    Public
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="privacy"
                      checked={!newCircleIsPublic}
                      onChange={() => setNewCircleIsPublic(false)}
                      className="mr-1"
                    />
                    Private
                  </label>
                </div>
                
                <button
                  onClick={handleCreateCircle}
                  className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  Save Circle
                </button>
              </div>
            )}

            <div className="space-y-4">
           {studyCircles.map(({ id, name, isPublic, members, created_by }) => (
  <div key={id} className="border rounded p-4 shadow bg-white">
   <div className="flex justify-between items-center mb-2">
  <div className="flex items-center gap-2">
    <h3 className="font-semibold text-blue-900 text-lg">{name}</h3>

   {created_by === userId && (
  <>
    <button
      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
      onClick={() => openAddMemberDropdown(id)}
    >
      + Add Members
    </button>
    <button
      className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 ml-2"
      onClick={() => handleDeleteCircle(id)}
    >
      🗑 Delete
    </button>
  </>
)}

  </div>

  <span
    className={`text-sm px-2 py-1 rounded ${
      isPublic ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"
    }`}
  >
    {isPublic ? "Public" : "Private"}
  </span>
</div>


    <p className="text-gray-700 mb-1">
      Members: {Array.isArray(members) && members.length > 0 ? members.join(", ") : "No members yet"}
    </p>

    {created_by === userId && showDropdownForCircle === id && (
  <div className="mt-2">
    <input
      type="text"
      value={searchQuery}
      onChange={handleSearchChange}
      placeholder="Search users..."
      className="p-1 border rounded text-sm w-full"
    />
    <ul className="mt-1 border rounded bg-white max-h-32 overflow-y-auto">
      {searchResults.map((user) => (
        <li
          key={user.id}
          onClick={() => handleAddMember(user.id, id)}
          className="px-2 py-1 cursor-pointer hover:bg-gray-100 text-sm"
        >
          {user.name} ({user.email})
        </li>
      ))}
    </ul>
  </div>
)}


   {members.includes(userEmail) ? (
  <div className="flex space-x-2 mt-2">
    <button
      onClick={() => toggleJoinCircle(id)}
      className="text-sm px-3 py-1 rounded bg-red-200 text-red-800 hover:bg-red-300"
    >
      Leave Circle
    </button>
    <button
      onClick={() => router.push(`/circlechat?id=${id}`)}
      className="text-sm px-3 py-1 rounded bg-blue-200 text-blue-800 hover:bg-blue-300"
    >
      Start Chat
    </button>
  </div>
) : isPublic ? (
  <button
    onClick={() => toggleJoinCircle(id)}
    className="mt-2 text-sm px-3 py-1 rounded bg-green-200 text-green-800 hover:bg-green-300"
  >
    Join Circle
  </button>
) : (
  <p className="text-sm text-red-500 mt-2">This is a private circle. You must be invited to join.</p>
)}

    {/* 🔧 Chat UI - show only if this is the active chat circle */}
    {activeChatCircle === id && (
      <div className="mt-4 border-t pt-4">
        <h4 className="text-blue-900 font-semibold mb-2">Group Chat</h4>
        <div className="h-40 overflow-y-auto bg-gray-100 p-2 mb-2 rounded text-sm">
          {(circleMessages[id] || []).map((msg, idx) => (
            <div key={idx}>
              <span className="font-semibold">{msg.sender || "You"}:</span> 
              <span className="whitespace-pre-wrap">{msg.message}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded text-sm"
          />
          <button
            onClick={() => sendMessageToCircle(id)}
            className="bg-blue-900 text-white px-4 py-1 rounded hover:bg-blue-800 text-sm"
          >
            Send
          </button>
        </div>
      </div>
    )}
    {/* 🔧 End Chat UI */}
  </div>
))}

            </div>
          </>
        )}
      </div>

      {/* Right Sidebar */}
      {activeTab === "discussion" && (
        <aside className="hidden lg:block col-span-1 p-4 bg-white rounded shadow h-fit sticky top-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Top Topics</h2>
          <ul className="space-y-3">
            {topTopics.map(({ id, topic, likes }) => (
              <li key={id} className="text-gray-800 hover:text-blue-900 cursor-pointer border-b border-gray-200 pb-2">
                {topic} ({likes} likes)
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
    </AuthGuard>
  );
}

