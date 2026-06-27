import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import socket from '../lib/socket';

function Home() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const conversations = useChatStore((state) => state.conversations);
  const searchResults = useChatStore((state) => state.searchResults);
  const getConversations = useChatStore((state) => state.getConversations);
  const searchUsers = useChatStore((state) => state.searchUsers);
  const clearSearch = useChatStore((state) => state.clearSearch);
  const startConversation = useChatStore((state) => state.startConversation);
  const onlineUsers = useChatStore((state) => state.onlineUsers);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('join', user._id);
      getConversations();
    }

    socket.on('online-users', (users) => {
      useChatStore.getState().setOnlineUsers(users);
    });

    socket.on('new-message', (message) => {
      useChatStore.getState().addIncomingMessage(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchUsers(query);
    } else {
      clearSearch();
    }
  };

  const handleStartChat = async (receiverId) => {
    const conversation = await startConversation(receiverId);
    if (conversation) {
      navigate(`/chat/${conversation._id}`);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleLogout = () => {
    socket.disconnect();
    logout();
  };

  const getOtherUser = (conversation) => {
    return conversation.participants.find((p) => p._id !== user._id);
  };

  return (
    <div className="min-h-screen bg-[#0e1621] flex flex-col">
      {/* Header */}
      <div className="bg-[#17212b] px-4 py-3 flex items-center justify-between border-b border-[#2b5278]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2AABEE] rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.fullName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-white font-semibold">Samvaad</h2>
            <p className="text-[#7a8fa6] text-xs">
              {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-[#7a8fa6] hover:text-[#2AABEE] text-xl"
          >
            🔍
          </button>
          <button
            onClick={handleLogout}
            className="text-[#7a8fa6] hover:text-red-400 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="bg-[#17212b] px-4 py-3 border-b border-[#2b5278]">
          <input
            type="text"
            placeholder="Search users by name or username..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 bg-[#0e1621] border border-[#2b5278] rounded-lg text-white placeholder-[#546778] focus:outline-none focus:border-[#2AABEE] text-sm"
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {searchResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleStartChat(u._id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#2b5278] transition-colors"
                >
                  <div className="w-10 h-10 bg-[#2AABEE] rounded-full flex items-center justify-center text-white font-bold">
                    {u.fullName[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{u.fullName}</p>
                    <p className="text-[#7a8fa6] text-xs">@{u.username}</p>
                  </div>
                  {onlineUsers.includes(u._id) && (
                    <span className="ml-auto text-green-400 text-xs">● Online</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="text-5xl mb-4">🗣️</div>
            <p className="text-[#7a8fa6] text-lg mb-2">No chats yet</p>
            <p className="text-[#546778] text-sm">
              Tap 🔍 to search for users and start chatting!
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const otherUser = getOtherUser(conv);
            if (!otherUser) return null;
            return (
              <button
                key={conv._id}
                onClick={() => navigate(`/chat/${conv._id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#17212b] transition-colors border-b border-[#17212b]"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-[#2AABEE] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {otherUser.fullName[0].toUpperCase()}
                  </div>
                  {onlineUsers.includes(otherUser._id) && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#0e1621]"></div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-white font-medium">{otherUser.fullName}</p>
                    <span className="text-[#546778] text-xs">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#7a8fa6] text-sm truncate">
                    {conv.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Home;
