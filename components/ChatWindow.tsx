import React, { useState, useEffect, useRef, FormEvent } from "react";
import { apiFetch } from "../apiClient";  // Adjust path as needed


type Message = {
  id: number;
  sender_id: number;
  receiver_id: number;
  message_text: string;
  sent_at: string;
  read_at?: string | null;
};

type UserNames = {
  [key: number]: string; // userId to userName mapping
};

export default function ChatWindow({ otherUserId }: { otherUserId: number }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userNames, setUserNames] = useState<UserNames>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!userId || !otherUserId) {
        console.warn("Missing userId or otherUserId, skipping fetch");
        return;
      }

      setLoading(true);

      const token = localStorage.getItem("token");
      try {
        // Fetch messages in conversation
        const resMsgs = await apiFetch(
          `/messages/conversation?user1=${userId}&user2=${otherUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resMsgs.ok) {
          const text = await resMsgs.text();
          console.error("Fetch messages error text:", text);
          throw new Error("Failed to fetch messages");
        }
        const msgs = await resMsgs.json();
        setMessages(msgs);

        // Fetch user info for both users
        const resUser1 = await apiFetch(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resUser2 = await apiFetch(`/users/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resUser1.ok) throw new Error("Failed to fetch user info for current user");

        const user1 = await resUser1.json();

        let user2;
        if (resUser2.status === 403) {
          // Fallback when forbidden to get other user info
          user2 = { id: otherUserId, name: "Unknown" };
        } else if (!resUser2.ok) {
          throw new Error("Failed to fetch user info for other user");
        } else {
          user2 = await resUser2.json();
        }

        setUserNames({
          [user1.id]: user1.name || "Unknown",
          [user2.id]: user2.name || "Unknown",
        });

        scrollToBottom();

        // Mark messages read after loading
        const resMarkRead = await apiFetch("/messages/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otherUserId }),
        });
        if (!resMarkRead.ok) throw new Error("Failed to mark messages as read");
          window.dispatchEvent(new Event("messagesRead"));

        // Dispatch events for notification badge update
        window.dispatchEvent(new Event("messagesRead"));
        localStorage.setItem("lastReadMessageTimestamp", new Date().toISOString());
        window.dispatchEvent(new Event("storage"));
      } catch (error) {
        console.error("Error loading chat data:", error);
        alert("Error loading chat data.");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, otherUserId]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || !otherUserId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await apiFetch("/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_id: otherUserId,
          message_text: newMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const sentMessage = await res.json();

      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message.");
    }
  };

  if (!userId) return <p>Loading user...</p>;

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <h2 className="text-xl font-semibold mb-4">
        Chat with {userNames[otherUserId] || "Unknown"}
      </h2>

      <div
        className="flex-grow overflow-auto border rounded p-4 mb-4"
        style={{ maxHeight: "60vh" }}
      >
        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p>No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-3 max-w-xs px-3 py-2 rounded ${
                msg.sender_id === userId
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-300 text-black self-start"
              }`}
              style={{
                alignSelf: msg.sender_id === userId ? "flex-end" : "flex-start",
              }}
            >
              <p className="font-semibold text-sm">
                {userNames[msg.sender_id] || "Unknown"}
              </p>
              <p>{msg.message_text}</p>
              <small className="block text-xs text-right opacity-70">
                {new Date(msg.sent_at).toLocaleString()}
              </small>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow border rounded px-3 py-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-600 text-white px-4 rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
