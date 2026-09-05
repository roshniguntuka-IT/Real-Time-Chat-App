import { useEffect, useState } from "react";
import socket from "../socket";

function Chat({ conversation, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `http://localhost:5000/api/messages/${conversation._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [conversation]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      if (
        conversation &&
        message.conversationId === conversation._id
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [conversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() || !conversation) {
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId: conversation._id,
            text: text.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      socket.emit("sendMessage", data.data);

      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!conversation) {
    return (
      <div className="empty-chat">
        <div className="empty-chat-icon">💬</div>
        <h2>Select a conversation</h2>
        <p>
          Choose a user from the sidebar to start chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-window">

      {/* ================= CHAT HEADER ================= */}

      <div className="chat-header">

        <div className="chat-user-avatar">
          {selectedUser?.name
            ?.split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase()}
        </div>

        <div className="chat-user-info">
          <h2>{selectedUser?.name}</h2>

          <p>
            <span
              className={
                selectedUser?.isOnline
                  ? "chat-online-dot"
                  : "chat-offline-dot"
              }
            ></span>

            {selectedUser?.isOnline
              ? "Online"
              : "Offline"}
          </p>
        </div>

        <button className="chat-menu">
          ⋮
        </button>

      </div>

      {/* ================= MESSAGES ================= */}

      <div className="messages">

        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet.</p>
            <span>Start the conversation 👋</span>
          </div>
        ) : (
          messages.map((message) => {

            const senderId =
              message.sender?._id || message.sender;

            const isMine =
              senderId?.toString() ===
              currentUser?.id?.toString();

            return (
              <div
                key={message._id}
                className={`message ${
                  isMine
                    ? "message-mine"
                    : "message-other"
                }`}
              >

                <div className="message-bubble">

                  <div className="message-name">
                    {isMine
                      ? currentUser?.name
                      : message.sender?.name}
                  </div>

                  <div className="message-content">
                    {message.text}
                  </div>

                  <div className="message-footer">

                    <span className="message-time">
                      {new Date(
                        message.createdAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {isMine && (
                      <span className="message-check">
                        ✓✓
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          })
        )}

      </div>

      {/* ================= MESSAGE INPUT ================= */}

      <form
        className="message-form"
        onSubmit={handleSendMessage}
      >

        <button
          type="button"
          className="emoji-button"
        >
          ☺
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
        />

        <button
          type="submit"
          className="send-button"
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>

      </form>

    </div>
  );
}

export default Chat;