import { useEffect, useState } from "react";

function NewChat({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setUsers(data.users);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <p>Loading users...</p>;
  }

  return (
    <div className="new-chat">
      <h2>New Chat</h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="user-list">
        {filteredUsers.length === 0 ? (
          <p className="no-users">No users found.</p>
        ) : (
          filteredUsers.map((user) => (
            <div
              className="user-item"
              key={user._id}
              onClick={() => onSelectUser(user)}
            >

              {/* Online / Offline Dot */}
              <span
                className={
                  user.isOnline
                    ? "online-dot"
                    : "offline-dot"
                }
              ></span>

              {/* Avatar */}
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* User Information */}
              <div className="user-info">
                <strong>{user.name}</strong>
                <p>{user.email}</p>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NewChat;