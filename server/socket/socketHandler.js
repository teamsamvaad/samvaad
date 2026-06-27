const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const connectedUsers = new Map();

function socketHandler(io, socket) {
  console.log('User connected:', socket.id);

  // User comes online
  socket.on('join', async (userId) => {
    connectedUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: Date.now() });
    io.emit('user-online', userId);
    io.emit('online-users', Array.from(connectedUsers.keys()));
  });

  // Send message
  socket.on('send-message', async (data) => {
    const { conversationId, senderId, text } = data;

    try {
      const message = new Message({
        conversationId,
        sender: senderId,
        text,
      });

      await message.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageAt: Date.now(),
      });

      const populatedMessage = await message.populate('sender', '-password');

      // Find conversation participants
      const conversation = await Conversation.findById(conversationId);
      const otherUserId = conversation.participants.find(
        (p) => p.toString() !== senderId
      );

      // Send to receiver if online
      const receiverSocketId = connectedUsers.get(otherUserId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new-message', populatedMessage);
      }

      // Send back to sender
      socket.emit('new-message', populatedMessage);
    } catch (error) {
      console.error('Socket message error:', error.message);
    }
  });

  // Typing indicator
  socket.on('typing', async (data) => {
    const { conversationId, senderId } = data;
    const conversation = await Conversation.findById(conversationId);
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== senderId
    );
    const receiverSocketId = connectedUsers.get(otherUserId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', { conversationId, senderId });
    }
  });

  socket.on('stop-typing', async (data) => {
    const { conversationId, senderId } = data;
    const conversation = await Conversation.findById(conversationId);
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== senderId
    );
    const receiverSocketId = connectedUsers.get(otherUserId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-stop-typing', { conversationId, senderId });
    }
  });

  // User goes offline
  socket.on('disconnect', async () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        connectedUsers.delete(userId);
        break;
      }
    }
    if (disconnectedUserId) {
      await User.findByIdAndUpdate(disconnectedUserId, {
        isOnline: false,
        lastSeen: Date.now(),
      });
      io.emit('user-offline', disconnectedUserId);
      io.emit('online-users', Array.from(connectedUsers.keys()));
    }
    console.log('User disconnected:', socket.id);
  });
}

module.exports = socketHandler;
