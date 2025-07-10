import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { apiFetch } from "../apiClient"; 
// ✅ Define message structure
type Message = {
  id: number;
  sender: string;
  senderId: number;
  message: string;
  timestamp?: string;
};


export default function CircleChat() {
  const router = useRouter();
  const { id } = router.query;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
const [userName, setUserName] = useState<string>("");
const [circleName, setCircleName] = useState<string>("");



  // ✅ Fetch all messages for this circle
  useEffect(() => {
  const fetchMessages = async () => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await apiFetch(`/study-circles/${id}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    } else {
      console.error("Failed to fetch messages.");
    }
  };

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await apiFetch("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const user = await res.json();
      setUserId(user.id);
      setUserName(user.name);
    }
  };

  const fetchCircleInfo = async () => {
  if (!id) return;
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await apiFetch(`/study-circles/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error("Failed to fetch circle info");
    return;
  }

  const data = await res.json();
console.log("🟡 Circle API Response:", data);

  // Check if name exists in the response
  if (data?.name) {
    setCircleName(data.name);
  } else if (data?.circle?.name) {
    setCircleName(data.circle.name);
  } else {
    console.warn("⚠️ Circle name not found in response:", data);
    setCircleName(""); // fallback
  }
};
const fetchCircleNameFromAll = async () => {
  const token = localStorage.getItem("token");
  if (!token || !id) return;

  const res = await apiFetch("/study-circles", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error("Failed to fetch all circles");
    return;
  }

  const circles = await res.json();
  const match = circles.find((c: any) => c.id === parseInt(id as string));
  if (match) {
    setCircleName(match.name);
  } else {
    console.warn("Circle not found in list");
  }
};


  fetchUser();
  fetchMessages();
  fetchCircleInfo();
  fetchCircleNameFromAll();

}, [id]);

  // ✅ Send new message
  const sendMessageToCircle = async () => {
    if (!newMessage.trim() || !id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await apiFetch(`/study-circles/${id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: newMessage }),
    });

    if (res.ok) {
      const savedMessage = await res.json(); // Expecting full message object
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage("");
    } else {
      alert("Failed to send message.");
    }
  };

  // ✅ Navigate back to study circles tab
  const goBackToCircles = () => {
    router.push("/discussion-board?tab=studyCircle");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* 🔙 Back Button */}
      <button
        onClick={goBackToCircles}
        className="mb-4 bg-gray-200 text-gray-800 px-4 py-1 rounded hover:bg-gray-300"
      >
        ← Back to All Circles
      </button>

      <h1 className="text-2xl font-bold text-blue-900 mb-4">
  Chat in {circleName ? `Circle: ${circleName}` : `Circle #${id}`}
</h1>


      <div className="h-60 overflow-y-auto bg-gray-100 p-3 rounded mb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet.</p>
        ) : (
          messages.map((msg) => (
  <div key={msg.id} className="mb-2 text-sm text-gray-800">
    <span className="font-semibold text-blue-900">
      {msg.senderId === userId ? "You" : msg.sender}:
    </span>{" "}
    {msg.message}
  </div>
))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={sendMessageToCircle}
          className="bg-blue-900 text-white px-4 py-1 rounded hover:bg-blue-800"
        >
          Send
        </button>
      </div>
    </div>
  );
}
