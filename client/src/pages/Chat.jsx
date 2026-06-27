import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import socket from '../lib/socket';
import API from '../lib/axios';

function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const messages = useChatStore((state) => state.messages);
  const currentConversation = useChatStore((state) => state.currentConversation);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const getMessages = useChatStore((state) => state.getMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const getConversations = useChatStore((state) => state.getConversations);
  const onlineUsers = useChatStore((state) => state.onlineUsers);

  const [text, setText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      selectConversation({ _id: conversationId });
      getMessages(conversationId);
      socket.emit('mark-read', { conversationId, userId: user._id });
      pollRef.current = setInterval(() => { getMessages(conversationId); }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conversationId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    socket.on('new-message', (message) => {
      useChatStore.getState().addIncomingMessage(message);
      if (message.conversationId === conversationId) {
        socket.emit('mark-read', { conversationId, userId: user._id });
        getConversations();
      }
    });
    socket.on('messages-read', ({ conversationId: convId }) => {
      if (convId === conversationId) { getMessages(conversationId); }
    });
    socket.on('message-deleted', ({ messageId }) => {
      useChatStore.setState((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
    });
    return () => { socket.off('new-message'); socket.off('messages-read'); socket.off('message-deleted'); };
  }, [conversationId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage(conversationId, text.trim());
    socket.emit('send-message', { conversationId, senderId: user._id, text: text.trim() });
    socket.emit('stop-typing', { conversationId, senderId: user._id });
    setText('');
    getConversations();
  };

  const handleTyping = (value) => {
    setText(value);
    if (value.trim()) {
      socket.emit('typing', { conversationId, senderId: user._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { conversationId, senderId: user._id });
      }, 2000);
    } else {
      socket.emit('stop-typing', { conversationId, senderId: user._id });
    }
  };

  const handleDeleteMessage = async (messageId, forEveryone) => {
    try {
      await API.delete(`/chat/messages/${messageId}`, { data: { forEveryone } });
      socket.emit('delete-message', { messageId, forEveryone, conversationId });
      useChatStore.setState((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
      setSelectedMessage(null);
      getConversations();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const otherUser = currentConversation?.participants?.find(
    (p) => p._id !== user?._id
  );

  const formatMsgTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="h-full bg-[#0e1621] flex flex-col relative">

      {/* Contact Info Panel */}
      {showContactInfo && otherUser && (
        <div className="absolute inset-0 z-50 fade-in">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowContactInfo(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[300px] bg-[#17212b] overflow-y-auto">
            <div className="bg-[#1c2e3f] p-5 pb-6 flex flex-col items-center">
              <button onClick={() => setShowContactInfo(false)} className="self-start mb-4 text-[#7a8fa6] hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {otherUser.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <p className="text-white font-semibold text-lg mt-3">{otherUser.fullName}</p>
              <p className="text-[#7a8fa6] text-sm">@{otherUser.username}</p>
              <p className="text-[#546778] text-xs mt-1">
                {onlineUsers.includes(otherUser._id) ? '🟢 Online' : '⚫ Last seen recently'}
              </p>
            </div>
            <div className="py-2">
              <div className="px-5 py-3 flex items-center gap-3">
                <span className="text-lg">📧</span>
                <div>
                  <p className="text-[#7a8fa6] text-[11px]">Email</p>
                  <p className="text-white text-sm">{otherUser.email}</p>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center gap-3">
                <span className="text-lg">🔊</span>
                <div>
                  <p className="text-white text-sm">Notifications</p>
                  <p className="text-[#546778] text-xs">On</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Action Menu */}
      {selectedMessage && (
        <div className="absolute inset-0 z-40 fade-in flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedMessage(null)}></div>
          <div className="relative bg-[#17212b] rounded-t-2xl w-full max-w-md p-5 slide-up">
            <div className="w-10 h-1 bg-[#3a5068] rounded-full mx-auto mb-5"></div>
            <p className="text-[#7a8fa6] text-sm mb-4 px-2 break-words max-h-[60px] overflow-y-auto">"{selectedMessage.text}"</p>
            <div className="space-y-1">
              <button
                onClick={() => { navigator.clipboard?.writeText(selectedMessage.text); setSelectedMessage(null); }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#243647] transition-colors"
              >
                <span className="text-lg">📋</span>
                <span className="text-white text-[14px]">Copy</span>
              </button>
              <button
                onClick={() => handleDeleteMessage(selectedMessage._id, false)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#243647] transition-colors"
              >
                <span className="text-lg">🗑️</span>
                <span className="text-white text-[14px]">Delete for Me</span>
              </button>
              {selectedMessage.sender?._id === user?._id && (
                <button
                  onClick={() => handleDeleteMessage(selectedMessage._id, true)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#243647] transition-colors"
                >
                  <span className="text-lg">💣</span>
                  <span className="text-red-400 text-[14px]">Delete for Everyone</span>
                </button>
              )}
              <button
                onClick={() => setSelectedMessage(null)}
                className="w-full flex items-center justify-center px-4 py-3 rounded-xl hover:bg-[#243647] transition-colors"
              >
                <span className="text-[#7a8fa6] text-[14px]">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div
        className="bg-[#17212b] px-3 py-2.5 flex items-center gap-2.5 shrink-0 border-b border-[#1c2e3f] cursor-pointer"
        onClick={() => setShowContactInfo(true)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/'); }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#7a8fa6] hover:bg-[#243647] hover:text-white shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white font-bold text-sm">
            {otherUser?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
          </div>
          {onlineUsers.includes(otherUser?._id) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#2ecc71] rounded-full border-2 border-[#17212b] pulse-online"></div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-[15px] leading-tight truncate">{otherUser?.fullName}</h3>
          <p className="text-[11px] text-[#546778]">
            {onlineUsers.includes(otherUser?._id) ? 'online' : 'last seen recently'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-[#7a8fa6] hover:bg-[#243647] hover:text-[#2AABEE]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2317212b\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[#17212b] flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2b5278" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-[#4a6580] text-sm">Say hello! 👋</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <span className="bg-[#17212b]/80 text-[#546778] text-[11px] px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              {msgs.map((msg, idx) => {
                const isMe = msg.sender?._id === user?._id;
                const prevMsg = msgs[idx - 1];
                const sameSender = prevMsg && prevMsg.sender?._id === msg.sender?._id;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${sameSender ? 'mt-0.5' : 'mt-2.5'}`}
                    onClick={() => setSelectedMessage(msg)}
                  >
                    <div
                      className={`relative max-w-[80%] px-3 py-1.5 cursor-pointer active:scale-[0.98] transition-transform ${
                        isMe
                          ? 'bg-[#2AABEE] text-white rounded-2xl rounded-br-sm'
                          : 'bg-[#182533] text-white rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      <p className="text-[14px] leading-[1.35] break-words">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className={`text-[10px] ${isMe ? 'text-white/50' : 'text-[#4a6580]'}`}>
                          {formatMsgTime(msg.createdAt)}
                        </span>
                        {isMe && (
                          <span className={`text-[10px] ${msg.read ? 'text-[#a0d8ef]' : 'text-white/30'}`}>✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-[#17212b] px-3 py-2.5 shrink-0 border-t border-[#1c2e3f]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-[#0e1621] rounded-full border border-[#243647] focus-within:border-[#2AABEE] px-4 py-1">
            <input
              type="text"
              placeholder="Message"
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-[#4a6580] focus:outline-none text-[14px] py-1.5"
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
              text.trim() ? 'bg-[#2AABEE] text-white shadow-md shadow-[#2AABEE]/30 hover:bg-[#229ED9]' : 'bg-[#243647] text-[#4a6580]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
