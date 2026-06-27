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

      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.lastMessage = text;
        conversation.lastMessageAt = Date.now();

        conversation.participants.forEach((participantId) => {
          const pId = participantId.toString();
          if (pId !== senderId.toString()) {
            const currentCount = conversation.unreadCount.get(pId) || 0;
            conversation.unreadCount.set(pId, currentCount + 1);
          }
        });

        await conversation.save();
      }

      const populatedMessage = await message.populate('sender', '-password');
      const populatedConversation = await Conversation.findById(conversationId).populate('participants', '-password');

      const otherUserId = conversation.participants.find(
        (p) => p.toString() !== senderId
      );

      // Send to receiver if online
      const receiverSocketId = connectedUsers.get(otherUserId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new-message', populatedMessage);
        io.to(receiverSocketId).emit('conversation-updated', populatedConversation);
      }

      // Send back to sender
      socket.emit('new-message', populatedMessage);
      socket.emit('conversation-updated', populatedConversation);
    } catch (error) {
      console.error('Socket message error:', error.message);
    }
  });

  // Mark messages as read
  socket.on('mark-read', async (data) => {
    const { conversationId, userId } = data;
    try {
      await Message.updateMany(
        { conversationId, read: false, sender: { $ne: userId } },
        { read: true }
      );
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.unreadCount.set(userId.toString(), 0);
        await conversation.save();
      }
      const otherUserId = conversation.participants.find(
        (p) => p.toString() !== userId
      );
      const receiverSocketId = connectedUsers.get(otherUserId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('messages-read', { conversationId, userId });
      }
    } catch (error) {
      console.error('Mark read error:', error.message);
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
  // Delete message
  socket.on('delete-message', async (data) => {
    const { messageId, forEveryone, conversationId } = data;
    try {
      if (forEveryone) {
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.participants.forEach((participantId) => {
            const pId = participantId.toString();
            const socketId = connectedUsers.get(pId);
            if (socketId) {
              io.to(socketId).emit('message-deleted', { messageId });
            }
          });
        }
      }
    } catch (error) {
      console.error('Delete message socket error:', error.message);
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
