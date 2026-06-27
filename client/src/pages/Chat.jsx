import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import socket from '../lib/socket';

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
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingStopTimeoutRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      selectConversation({ _id: conversationId });
      getMessages(conversationId);

      socket.emit('mark-read', {
        conversationId,
        userId: user._id,
      });

      pollRef.current = setInterval(() => {
        getMessages(conversationId);
      }, 3000);
    }

    // Reset typing when switching conversations
    setIsOtherUserTyping(false);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket.on('new-message', (message) => {
      useChatStore.getState().addIncomingMessage(message);

      if (message.conversationId === conversationId) {
        socket.emit('mark-read', {
          conversationId,
          userId: user._id,
        });
        getConversations();
      }
    });

    socket.on('user-typing', ({ conversationId: convId, senderId }) => {
      if (convId === conversationId && senderId !== user._id) {
        setIsOtherUserTyping(true);
        // Auto-reset typing after 3 seconds if no stop event
        if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
        typingStopTimeoutRef.current = setTimeout(() => {
          setIsOtherUserTyping(false);
        }, 3000);
      }
    });

    socket.on('user-stop-typing', ({ conversationId: convId, senderId }) => {
      if (convId === conversationId && senderId !== user._id) {
        setIsOtherUserTyping(false);
      }
    });

    socket.on('messages-read', ({ conversationId: convId }) => {
      if (convId === conversationId) {
        getMessages(conversationId);
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('messages-read');
    };
  }, [conversationId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    await sendMessage(conversationId, text.trim());

    socket.emit('send-message', {
      conversationId,
      senderId: user._id,
      text: text.trim(),
    });

    socket.emit('stop-typing', {
      conversationId,
      senderId: user._id,
    });

    setText('');
    getConversations();
  };

  const handleTyping = (value) => {
    setText(value);
    if (value.trim()) {
      socket.emit('typing', {
        conversationId,
        senderId: user._id,
      });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', {
          conversationId,
          senderId: user._id,
        });
      }, 2000);
    } else {
      socket.emit('stop-typing', {
        conversationId,
        senderId: user._id,
      });
    }
  };

  const otherUser = currentConversation?.participants?.find(
    (p) => p._id !== user?._id
  );

  return (
    <div className="min-h-screen bg-[#0e1621] flex flex-col">
      {/* Chat Header */}
      <div className="bg-[#17212b] px-4 py-3 flex items-center gap-3 border-b border-[#2b5278]">
        <button
          onClick={() => navigate('/')}
          className="text-[#7a8fa6] hover:text-white text-lg"
        >
          ←
        </button>
        <div className="relative">
          <div className="w-10 h-10 bg-[#2AABEE] rounded-full flex items-center justify-center text-white font-bold text-lg">
            {otherUser?.fullName?.[0]?.toUpperCase() || '?'}
          </div>
          {onlineUsers.includes(otherUser?._id) && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#17212b]"></div>
          )}
        </div>
        <div>
          <h3 className="text-white font-semibold">{otherUser?.fullName}</h3>
          <p className="text-xs text-[#7a8fa6]">
            {isOtherUserTyping
              ? 'typing...'
              : onlineUsers.includes(otherUser?._id)
              ? 'online'
              : 'offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#546778]">Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === user?._id;
            return (
              <div
                key={msg._id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isMe
                      ? 'bg-[#2AABEE] text-white rounded-br-sm'
                      : 'bg-[#182533] text-white rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm break-words">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p
                      className={`text-[10px] ${
                        isMe ? 'text-white/60' : 'text-[#546778]'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {isMe && (
                      <span className={`text-[10px] ${msg.read ? 'text-[#2AABEE]' : 'text-white/40'}`}>
                        ✓✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isOtherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-[#182533] px-4 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#7a8fa6] rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-[#7a8fa6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-[#7a8fa6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-[#17212b] px-4 py-3 border-t border-[#2b5278]">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#0e1621] border border-[#2b5278] rounded-full text-white placeholder-[#546778] focus:outline-none focus:border-[#2AABEE] text-sm"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-10 h-10 bg-[#2AABEE] rounded-full flex items-center justify-center text-white hover:bg-[#229ED9] transition-colors disabled:opacity-30"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
