import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import socket from '../lib/socket';

function Contacts() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const conversations = useChatStore((state) => state.conversations);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const getConversations = useChatStore((state) => state.getConversations);
  const startConversation = useChatStore((state) => state.startConversation);

  useEffect(() => {
    if (user) { getConversations(); }
  }, [user]);

  const handleOpenChat = async (otherUserId) => {
    const conversation = await startConversation(otherUserId);
    if (conversation) { navigate(`/chat/${conversation._id}`); }
  };

  // Extract unique contacts from conversations
  const contacts = conversations
    .map((conv) => {
      const other = conv.participants?.find((p) => p._id !== user?._id);
      return other || null;
    })
    .filter(Boolean)
    .filter((contact, index, self) =>
      index === self.findIndex((c) => c._id === contact._id)
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Group by first letter
  const grouped = contacts.reduce((acc, contact) => {
    const letter = contact.fullName[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
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
        <h1 className="text-white font-semibold text-[17px]">Contacts</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#17212b] flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b5278" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <p className="text-[#7a8fa6] text-base font-medium mb-1">No contacts yet</p>
            <p className="text-[#4a6580] text-sm">Start a chat to add contacts</p>
          </div>
        ) : (
          Object.entries(grouped).map(([letter, letterContacts]) => (
            <div key={letter}>
              <div className="px-5 py-1.5 bg-[#0d1420]">
                <p className="text-[#2AABEE] text-xs font-bold">{letter}</p>
              </div>
              {letterContacts.map((contact) => (
                <button
                  key={contact._id}
                  onClick={() => handleOpenChat(contact._id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#17212b] active:bg-[#1c2e3f] transition-colors"
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white font-bold text-sm">
                      {contact.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    {onlineUsers.includes(contact._id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#2ecc71] rounded-full border-2 border-[#0e1621] pulse-online"></div>
                    )}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-white font-medium text-[14px]">{contact.fullName}</p>
                    <p className="text-[#546778] text-xs">@{contact.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Contacts;
