const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const User = require("./models/User");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

/* Track active sockets for every user */
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* =========================
     USER ONLINE
  ========================= */

  socket.on("userOnline", async (userId) => {
    try {
      if (!userId) {
        return;
      }

      /* Prevent the same socket from registering twice */
      if (socket.userId === userId) {
        return;
      }

      /* If this socket belonged to another user */
      if (socket.userId) {
        const oldUserId = socket.userId;
        const oldUserSockets = onlineUsers.get(oldUserId);

        if (oldUserSockets) {
          oldUserSockets.delete(socket.id);

          if (oldUserSockets.size === 0) {
            onlineUsers.delete(oldUserId);

            await User.findByIdAndUpdate(oldUserId, {
              isOnline: false,
            });

            io.emit("userStatusChanged", {
              userId: oldUserId,
              isOnline: false,
            });

            console.log(
              "Previous user is offline:",
              oldUserId
            );
          }
        }
      }

      socket.userId = userId;

      let userSockets = onlineUsers.get(userId);

      if (!userSockets) {
        userSockets = new Set();
        onlineUsers.set(userId, userSockets);
      }

      const wasOffline = userSockets.size === 0;

      userSockets.add(socket.id);

      /*
        Only mark the user online when
        this is their first active socket.
      */
      if (wasOffline) {
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
        });

        io.emit("userStatusChanged", {
          userId,
          isOnline: true,
        });

        console.log("User is online:", userId);
      }
    } catch (error) {
      console.error(
        "Online status error:",
        error
      );
    }
  });

  /* =========================
     JOIN CONVERSATION
  ========================= */

  socket.on("joinConversation", (conversationId) => {
    if (!conversationId) {
      return;
    }

    socket.join(conversationId);

    console.log(
      `Socket ${socket.id} joined conversation ${conversationId}`
    );
  });

  /* =========================
     SEND MESSAGE
  ========================= */

  socket.on("sendMessage", (message) => {
    if (!message || !message.conversationId) {
      return;
    }

    io.to(message.conversationId).emit(
      "newMessage",
      message
    );
  });

  /* =========================
     USER OFFLINE / LOGOUT
  ========================= */

  socket.on("userOffline", async () => {
    try {
      if (!socket.userId) {
        return;
      }

      const userId = socket.userId;
      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        /*
          Only mark the user offline when
          there are no other active sockets.
        */
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
          });

          io.emit("userStatusChanged", {
            userId,
            isOnline: false,
          });

          console.log(
            "User is offline:",
            userId
          );
        }
      }

      socket.userId = null;
    } catch (error) {
      console.error(
        "Offline status error:",
        error
      );
    }
  });

  /* =========================
     SOCKET DISCONNECT
  ========================= */

  socket.on("disconnect", async () => {
    console.log(
      "User disconnected:",
      socket.id
    );

    try {
      if (!socket.userId) {
        return;
      }

      const userId = socket.userId;
      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        /*
          If this was the user's last active
          socket, mark them offline.
        */
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
          });

          io.emit("userStatusChanged", {
            userId,
            isOnline: false,
          });

          console.log(
            "User is offline:",
            userId
          );
        }
      }
    } catch (error) {
      console.error(
        "Disconnect status error:",
        error
      );
    }
  });
});

/* =========================
   HOME ROUTE
========================= */

app.get("/", (req, res) => {
  res.send("Real-Time Chat API is running");
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});