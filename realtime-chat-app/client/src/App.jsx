import { useEffect, useState } from "react";
import "./App.css";
import socket from "./socket";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Chat from "./components/Chat";
import ConversationList from "./components/ConversationList";
import NewChat from "./components/NewChat";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const [showSignup, setShowSignup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState(null);

  // Socket.IO connection
  useEffect(() => {
    if (!user) {
      return;
    }

    const sendOnlineStatus = () => {
      console.log(
        "Connected to Socket.IO:",
        socket.id
      );

      console.log(
        "Sending userOnline:",
        user.id
      );

      socket.emit("userOnline", user.id);
    };

    if (socket.connected) {
      sendOnlineStatus();
    } else {
      socket.on("connect", sendOnlineStatus);
    }

    return () => {
      socket.off("connect", sendOnlineStatus);
    };
  }, [user]);

  // Create a new conversation when selecting a user
  const handleSelectUser = async (selected) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
       `${import.meta.env.VITE_API_URL}/api/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: selected._id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setSelectedUser(selected);
      setConversation(data.conversation);

      socket.emit(
        "joinConversation",
        data.conversation._id
      );

      console.log(
        "Conversation opened:",
        data.conversation._id
      );
    } catch (error) {
      console.error(
        "Error creating conversation:",
        error
      );
    }
  };

  const handleSelectConversation = (conversation) => {
    const otherUser = conversation.participants.find(
      (participant) =>
        participant._id !== user.id
    );

    setSelectedUser(otherUser);
    setConversation(conversation);

    socket.emit(
      "joinConversation",
      conversation._id
    );

    console.log(
      "Conversation opened:",
      conversation._id
    );
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setSelectedUser(null);
    setConversation(null);
    setShowSignup(false);
  };


  console.log("Current user:", user);

 
  if (!user) {
    if (showSignup) {
      return (
        <Signup
          onSignup={setUser}
          onGoToLogin={() => setShowSignup(false)}
        />
      );
    }

    return (
      <Login
        onLogin={setUser}
        onGoToSignup={() => setShowSignup(true)}
      />
    );
  }

  return (
    <div className="chat-app">

      {/* Header */}
      <header className="app-header">
        <h1>Real-Time Chat App</h1>

        <div className="user-area">
          <span>Welcome, {user.name}!</span>

          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

     
      <main className="chat-container">

        {/* Sidebar */}
        <aside className="sidebar">

          <div className="sidebar-section">
            <NewChat
              onSelectUser={handleSelectUser}
            />
          </div>

          <div className="sidebar-section">
            <ConversationList
              onSelectConversation={
                handleSelectConversation
              }
            />
          </div>

        </aside>

       
        <section className="chat-area">
          <Chat
            conversation={conversation}
            selectedUser={selectedUser}
          />
        </section>

      </main>

    </div>
  );
}

export default App;