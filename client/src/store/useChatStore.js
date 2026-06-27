import { create } from 'zustand';
import API from '../lib/axios';

const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  searchResults: [],
  onlineUsers: [],
  isTyping: false,

  // Search users
  searchUsers: async (query) => {
    if (!query) {
      set({ searchResults: [] });
      return;
    }
    try {
      const res = await API.get(`/chat/users/search?q=${query}`);
      set({ searchResults: res.data });
    } catch (error) {
      console.error('Search error:', error);
    }
  },

  // Clear search
  clearSearch: () => set({ searchResults: [] }),

  // Get conversations
  getConversations: async () => {
    try {
      const res = await API.get('/chat/conversations');
      set({ conversations: res.data });
    } catch (error) {
      console.error('Get conversations error:', error);
    }
  },

  // Start or get conversation with a user
  startConversation: async (receiverId) => {
    try {
      const res = await API.post('/chat/conversations', { receiverId });
      set({ currentConversation: res.data, searchResults: [] });
      get().getMessages(res.data._id);
      get().getConversations();
      return res.data;
    } catch (error) {
      console.error('Start conversation error:', error);
    }
  },

  // Select conversation
  selectConversation: (conversation) => {
    set({ currentConversation: conversation });
    get().getMessages(conversation._id);
  },

  // Get messages
  getMessages: async (conversationId) => {
    try {
      const res = await API.get(`/chat/messages/${conversationId}`);
      set({ messages: res.data });
    } catch (error) {
      console.error('Get messages error:', error);
    }
  },

  // Send message
  sendMessage: async (conversationId, text) => {
    try {
      const res = await API.post('/chat/messages', { conversationId, text });
      set((state) => ({
        messages: [...state.messages, res.data],
      }));
    } catch (error) {
      console.error('Send message error:', error);
    }
  },

  // Add incoming message
  addIncomingMessage: (message) => {
    set((state) => {
      if (state.currentConversation?._id === message.conversationId) {
        const exists = state.messages.some((m) => m._id === message._id);
        if (!exists) {
          return { messages: [...state.messages, message] };
        }
      }
      return state;
    });
    get().getConversations();
  },

  // Set typing
  setTyping: (value) => set({ isTyping: value }),

  // Set online users
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));

export default useChatStore;
