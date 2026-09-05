const express = require("express");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// SEND MESSAGE
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({
        message: "Conversation ID and message text are required",
      });
    }

    // Check conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Check user belongs to conversation
    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not part of this conversation",
      });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: req.userId,
      text,
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
// GET MESSAGE HISTORY
router.get("/:conversationId", authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not part of this conversation",
      });
    }

    const messages = await Message.find({
      conversationId,
    })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
module.exports = router;