import { useState, useEffect, useRef } from 'react';
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
  const updateConversation = useChatStore((state) => state.updateConversation);
  const onlineUsers = useChatStore((state) => state.onlineUsers);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const pollRef = useRef(null);

  const showBrowserNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const senderName = message.sender?.fullName || 'Someone';
      new Notification('Samvaad 💬', {
        body: `${senderName}: ${message.text}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🗣️</text></svg>',
        tag: message._id,
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
      pollRef.current = setInterval(() => { getConversations(); }, 5000);
    }

    socket.on('online-users', (users) => {
      useChatStore.getState().setOnlineUsers(users);
    });

    socket.on('new-message', (message) => {
      const isOnChatPage = window.location.hash.includes(message.conversationId);
      useChatStore.getState().addIncomingMessage(message);
      if (!isOnChatPage) { showBrowserNotification(message); }
      getConversations();
    });

    socket.on('conversation-updated', (updatedConv) => { updateConversation(updatedConv); });
    socket.on('messages-read', () => { getConversations(); });

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
    document.title = total > 0 ? `(${total}) Samvaad` : 'Samvaad';
  }, [conversations]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearchStatus('searching');
      await searchUsers(query);
      const results = useChatStore.getState().searchResults;
      setSearchStatus(results.length > 0 ? 'found' : 'notfound');
    } else {
      clearSearch();
      setSearchStatus('');
    }
  };

  const handleStartChat = async (receiverId) => {
    const conversation = await startConversation(receiverId);
    if (conversation) { navigate(`/chat/${conversation._id}`); }
    setSearchQuery('');
    setShowSearch(false);
    setSearchStatus('');
  };

  const handleLogout = () => { socket.disconnect(); logout(); };

  const getOtherUser = (conversation) => {
    return conversation.participants?.find((p) => p._id !== user._id);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  const menuItems = [
    { icon: '👤', label: 'My Profile', action: () => { setMenuOpen(false); navigate('/settings/profile'); } },
    { icon: '💾', label: 'Saved Messages', action: () => { setMenuOpen(false); navigate('/saved'); } },
    { icon: '👥', label: 'Contacts', action: () => { setMenuOpen(false); navigate('/contacts'); } },
    { icon: '📞', label: 'Calls', action: () => { setMenuOpen(false); navigate('/calls'); } },
    { icon: '⚙️', label: 'Settings', action: () => { setMenuOpen(false); navigate('/settings'); } },
  ];

  return (
    <div className="h-full bg-[#0e1621] flex flex-col relative">

      {/* Menu Overlay */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMenuOpen(false)}
          ></div>
          <div className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#17212b] z-50 overflow-y-auto slide-up">
            {/* Menu Header */}
            <div className="bg-[#1c2e3f] p-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
              </div>
              <p className="text-white font-semibold mt-3 text-[15px]">{user?.fullName}</p>
              <p className="text-[#7a8fa6] text-xs mt-0.5">@{user?.username}</p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-[#243647] active:bg-[#2b5278] transition-colors"
                >
                  <span className="text-lg w-7 text-center">{item.icon}</span>
                  <span className="text-white text-[14px]">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-[#243647] mx-4 my-2"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-3 hover:bg-[#243647] active:bg-[#2b5278] transition-colors"
            >
              <span className="text-lg w-7 text-center">🚪</span>
              <span className="text-red-400 text-[14px]">Log Out</span>
            </button>

            {/* Version */}
            <div className="px-5 py-4">
              <p className="text-[#3a5068] text-[11px]">Samvaad v1.0</p>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div className="bg-[#17212b] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#7a8fa6] hover:bg-[#243647] hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">Samvaad</h2>
            <p className="text-[#546778] text-[11px]">
              {onlineUsers.length > 0 ? `${onlineUsers.length} online` : 'No one online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowSearch(!showSearch); setSearchStatus(''); setSearchQuery(''); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#7a8fa6] hover:bg-[#243647] hover:text-[#2AABEE]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="bg-[#17212b] px-4 py-3 border-b border-[#1c2e3f] fade-in shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6580]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="Enter exact username..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0e1621] border border-[#243647] rounded-xl text-white placeholder-[#4a6580] focus:outline-none focus:border-[#2AABEE] text-sm"
            />
          </div>
          {searchStatus === 'notfound' && (
            <p className="text-[#e74c3c] text-xs mt-2.5">No user found with this username</p>
          )}
          {searchStatus === 'found' && (
            <p className="text-[#2ecc71] text-xs mt-2.5">User found! Tap to start chatting</p>
          )}
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-1">
              {searchResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleStartChat(u._id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#243647] transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {u.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-white font-medium text-sm">{u.fullName}</p>
                    <p className="text-[#546778] text-xs">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-[#17212b] flex items-center justify-center mb-5">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2b5278" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-[#7a8fa6] text-lg font-medium mb-1.5">No conversations yet</p>
            <p className="text-[#4a6580] text-sm leading-relaxed">
              Tap the search icon and enter<br />an exact username to start chatting
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
                onClick={() => navigate(`/chat/${conv._id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#17212b] active:bg-[#1c2e3f] transition-colors"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white font-bold">
                    {otherUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  {onlineUsers.includes(otherUser._id) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#2ecc71] rounded-full border-2 border-[#0e1621] pulse-online"></div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`text-[15px] truncate ${unread > 0 ? 'text-white font-semibold' : 'text-[#c4c9ce] font-medium'}`}>
                      {otherUser.fullName}
                    </p>
                    <span className={`text-[11px] shrink-0 ml-2 ${unread > 0 ? 'text-[#2AABEE] font-medium' : 'text-[#4a6580]'}`}>
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[13px] truncate flex-1 ${unread > 0 ? 'text-[#a0b4c8] font-medium' : 'text-[#546778]'}`}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                    {unread > 0 && (
                      <span className="ml-2 min-w-[20px] h-[20px] bg-[#2AABEE] rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1.5 shrink-0">
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
