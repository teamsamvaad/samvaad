import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import socket from '../lib/socket';
import API from '../lib/axios';

function SavedMessages() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initSavedMessages();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initSavedMessages = async () => {
    if (!user) return;
    try {
      // Create conversation with yourself
      const res = await API.post('/chat/conversations', { receiverId: user._id });
      const conv = res.data;
      setConversationId(conv._id);

      // Get messages
      const msgRes = await API.get(`/chat/messages/${conv._id}`);
      setMessages(msgRes.data);
    } catch (err) {
      console.error('Saved messages init error:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !conversationId) return;

    try {
      const res = await API.post('/chat/messages', {
        conversationId,
        text: text.trim(),
      });

      socket.emit('send-message', {
        conversationId,
        senderId: user._id,
        text: text.trim(),
      });

      setMessages((prev) => [...prev, res.data]);
      setText('');
    } catch (err) {
      console.error('Send error:', err);
    }
  };

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
    <div className="h-full bg-[#0e1621] flex flex-col">
      {/* Header */}
      <div className="bg-[#17212b] px-3 py-2.5 flex items-center gap-2.5 shrink-0 border-b border-[#1c2e3f]">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#7a8fa6] hover:bg-[#243647] hover:text-white shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <h3 className="text-white font-semibold text-[15px] leading-tight">Saved Messages</h3>
          <p className="text-[11px] text-[#546778]">Save messages here for later</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2317212b\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[#17212b] flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2b5278" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-[#4a6580] text-sm">Save messages here!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <span className="bg-[#17212b]/80 text-[#546778] text-[11px] px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              {msgs.map((msg) => (
                <div key={msg._id} className="flex justify-end mt-0.5">
                  <div className="max-w-[80%] px-3 py-1.5 bg-[#2AABEE] text-white rounded-2xl rounded-br-sm">
                    <p className="text-[14px] leading-[1.35] break-words">{msg.text}</p>
                    <span className="text-[10px] text-white/50 mt-0.5 block text-right">
                      {formatMsgTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#17212b] px-3 py-2.5 shrink-0 border-t border-[#1c2e3f]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-[#0e1621] rounded-full border border-[#243647] focus-within:border-[#2AABEE] px-4 py-1">
            <input
              type="text"
              placeholder="Save a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-[#4a6580] focus:outline-none text-[14px] py-1.5"
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
              text.trim() ? 'bg-[#2AABEE] text-white shadow-md' : 'bg-[#243647] text-[#4a6580]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default SavedMessages;
