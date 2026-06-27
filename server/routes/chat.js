const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const router = express.Router();

// Middleware: verify JWT token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Search users
router.get('/users/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.userId },
    }).select('-password');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all conversations for logged in user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .populate('participants', '-password')
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get or create conversation with a user
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const { receiverId } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, receiverId] },
    }).populate('participants', '-password');

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.userId, receiverId],
      });
      await conversation.save();
      conversation = await conversation.populate('participants', '-password');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a conversation
router.get('/messages/:conversationId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .populate('sender', '-password')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { conversationId: req.params.conversationId, read: false, sender: { $ne: req.userId } },
      { read: true }
    );

    // Reset unread count for this user
    const conversation = await Conversation.findById(req.params.conversationId);
    if (conversation) {
      conversation.unreadCount.set(req.userId.toString(), 0);
      await conversation.save();
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message
router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    const message = new Message({
      conversationId,
      sender: req.userId,
      text,
    });

    await message.save();

    // Update conversation's last message
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.lastMessage = text;
      conversation.lastMessageAt = Date.now();

      // Increment unread count for all participants except sender
      conversation.participants.forEach((participantId) => {
        const pId = participantId.toString();
        if (pId !== req.userId.toString()) {
          const currentCount = conversation.unreadCount.get(pId) || 0;
          conversation.unreadCount.set(pId, currentCount + 1);
        }
      });

      await conversation.save();
    }

    const populatedMessage = await message.populate('sender', '-password');

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get online users
router.get('/users/online', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ isOnline: true, _id: { $ne: req.userId } })
      .select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
