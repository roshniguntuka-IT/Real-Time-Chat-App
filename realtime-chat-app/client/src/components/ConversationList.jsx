import { useEffect, useState } from "react";
import socket from "../socket";

function ConversationList({ onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/conversations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setConversations(data.conversations);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error(
          "Error fetching conversations:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Real-time online/offline status
  useEffect(() => {
    const handleStatusChange = ({
      userId,
      isOnline,
    }) => {
      console.log(
        "Status changed:",
        userId,
        isOnline
      );

      setConversations((prev) =>
        prev.map((conversation) => ({
          ...conversation,
          participants:
            conversation.participants.map(
              (participant) =>
                String(participant._id) ===
                String(userId)
                  ? {
                      ...participant,
                      isOnline,
                    }
                  : participant
            ),
        }))
      );
    };

    socket.on(
      "userStatusChanged",
      handleStatusChange
    );

    return () => {
      socket.off(
        "userStatusChanged",
        handleStatusChange
      );
    };
  }, []);

  if (loading) {
    return <p>Loading conversations...</p>;
  }

  return (
    <div className="conversations">
      <h2>Conversations</h2>

      {conversations.length === 0 ? (
        <p className="no-conversations">
          No conversations yet.
        </p>
      ) : (
        <div className="conversation-list">
          {conversations.map((conversation) => {
            const otherUser =
              conversation.participants.find(
                (participant) =>
                  String(participant._id) !==
                  String(currentUser.id)
              );

            if (!otherUser) {
              return null;
            }

            return (
              <div
                className="conversation-item"
                key={conversation._id}
                onClick={() =>
                  onSelectConversation(conversation)
                }
              >
                <div className="conversation-avatar">
                  {otherUser.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="conversation-info">
                  <strong>
                    {otherUser.name}
                  </strong>

                  <p>{otherUser.email}</p>
                </div>

                <div className="conversation-status">
                  <span
                    className={
                      otherUser.isOnline
                        ? "online-dot"
                        : "offline-dot"
                    }
                  ></span>

                  <span>
                    {otherUser.isOnline
                      ? "Online"
                      : "Offline"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ConversationList;