const express = require("express");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE OR GET CONVERSATION
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (userId === req.userId.toString()) {
      return res.status(400).json({
        message: "You cannot start a conversation with yourself",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, userId] },
    });

    // Create if it doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userId, userId],
      });
    }

    res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
// GET MY CONVERSATIONS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .populate("participants", "name email isOnline")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;