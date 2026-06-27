import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

function Calls() {
  var navigate = useNavigate();
  var user = useAuthStore(function(state) { return state.user; });
  var conversations = useChatStore(function(state) { return state.conversations; });

  var contacts = conversations
    .map(function(conv) { return conv.participants && conv.participants.find(function(p) { return p._id !== user?._id; }); })
    .filter(Boolean)
    .filter(function(c, i, self) { return i === self.findIndex(function(x) { return x._id === c._id; }); });

  var handleOpenChat = async function(otherUserId) {
    var conversation = await useChatStore.getState().startConversation(otherUserId);
    if (conversation) { navigate('/chat/' + conversation._id); }
  };

  return (
    <div className="h-full bg-[#0e1621] flex flex-col">
      <div className="bg-[#17212b] px-3 py-2.5 flex items-center gap-2.5 shrink-0 border-b border-[#1c2e3f]">
        <button onClick={function() { navigate('/'); }} className="w-9 h-9 rounded-full flex items-center justify-center text-[#7a8fa6] hover:bg-[#243647] hover:text-white shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-white font-semibold text-[17px]">Calls</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#17212b] flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b5278" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <p className="text-[#7a8fa6] text-base font-medium mb-1">No call history</p>
            <p className="text-[#4a6580] text-sm">Voice and video calls coming soon</p>
          </div>
        ) : (
          contacts.map(function(contact) {
            return (
              <button key={contact._id} onClick={function() { handleOpenChat(contact._id); }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#17212b] active:bg-[#1c2e3f]">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {contact.fullName.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white font-medium text-[14px]">{contact.fullName}</p>
                  <p className="text-[#546778] text-xs">Tap to open chat</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Calls;
