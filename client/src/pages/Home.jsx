import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import socket from '../lib/socket';

// Create notification audio once (unlocked on first user tap)
let notificationAudio = null;
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  try {
    notificationAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    notificationAudio.volume = 0.01;
    notificationAudio.play().then(() => {
      audioUnlocked = true;
      // Now set the real notification sound
      notificationAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkYyDfXV2gIeNiYN9dXZ/hI2Jgn10dv+FjYmCfXR2/4WNiYJ9dHb/hY2Jgn10dv+FjYmCfXR2/4SNiYJ9dHb/hI2Jgn10dv+EjYmCfXR2/4ONiYJ9dHb/g42Jgn10dv+DjYmCfXR2/4ONiYJ9dHb/g42Jgn10dv+DjYmCfXR2/4ONiYJ9dHb/g42Jgn10dv+DjYmCfXR2/4ONiYJ9dHb/g42Jgn10dv+DjYmCfXR2/4ONiYJ9dHb/g42Jgn10dg==');
      notificationAudio.volume = 1;
    }).catch(() => {});
  } catch (e) {}
}

function playNotificationSound() {
  if (!audioUnlocked || !notificationAudio) return;
  try {
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(() => {});
  } catch (e) {}
}

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
  const updateConversation = useChatStore((state) => state.updateConversation);
  const onlineUsers = useChatStore((state) => state.onlineUsers);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const pollRef = useRef(null);

  const showBrowserNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const senderName = message.sender?.fullName || 'Someone';
      new Notification('Samvaad 💬', {
        body: `${senderName}: ${message.text}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🗣️</text></svg>',
        tag: message._id,
        requireInteraction: false,
        silent: false,
      });
    }
  };

  const getUnreadCount = (conversation) => {
    const uc = conversation.unreadCount;
    if (!uc) return 0;
    if (typeof uc.get === 'function') return uc.get(user._id) || 0;
    return uc[user._id] || 0;
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('join', user._id);
      getConversations();

      pollRef.current = setInterval(() => {
        getConversations();
      }, 5000);
    }

    socket.on('online-users', (users) => {
      useChatStore.getState().setOnlineUsers(users);
    });

    socket.on('new-message', (message) => {
      const isOnChatPage = window.location.hash.includes(message.conversationId);

      useChatStore.getState().addIncomingMessage(message);

      if (!isOnChatPage) {
        playNotificationSound();
        showBrowserNotification(message);
      }

      getConversations();
    });

    socket.on('conversation-updated', (updatedConv) => {
      updateConversation(updatedConv);
    });

    socket.on('messages-read', () => {
      getConversations();
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      socket.off('online-users');
      socket.off('new-message');
      socket.off('conversation-updated');
      socket.off('messages-read');
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const total = conversations.reduce((sum, conv) => sum + getUnreadCount(conv), 0);
    setTotalUnread(total);

    if (total > 0) {
      document.title = `(${total}) Samvaad`;
    } else {
      document.title = 'Samvaad';
    }
  }, [conversations]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    unlockAudio();
    if (query.trim()) {
      searchUsers(query);
    } else {
      clearSearch();
    }
  };

  const handleStartChat = async (receiverId) => {
    unlockAudio();
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
    return conversation.participants?.find((p) => p._id !== user._id);
  };

  return (
    <div className="min-h-screen bg-[#0e1621] flex flex-col" onClick={unlockAudio}>
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
            onClick={() => { unlockAudio(); setShowSearch(!showSearch); }}
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
            const unread = getUnreadCount(conv);
            return (
              <button
                key={conv._id}
                onClick={() => { unlockAudio(); navigate(`/chat/${conv._id}`); }}
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
                    <p className={`font-medium ${unread > 0 ? 'text-white' : 'text-[#c4c9ce]'}`}>
                      {otherUser.fullName}
                    </p>
                    <span className={`text-xs ${unread > 0 ? 'text-[#2AABEE]' : 'text-[#546778]'}`}>
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate flex-1 ${unread > 0 ? 'text-white font-medium' : 'text-[#7a8fa6]'}`}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                    {unread > 0 && (
                      <span className="ml-2 min-w-[20px] h-5 bg-[#2AABEE] rounded-full flex items-center justify-center text-white text-xs font-bold px-1.5">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
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
