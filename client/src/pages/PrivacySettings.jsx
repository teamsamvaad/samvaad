import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/axios';

function PrivacySettings() {
  var navigate = useNavigate();
  var [blockedUsers, setBlockedUsers] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() { fetchBlockedUsers(); }, []);

  var fetchBlockedUsers = async function() {
    try {
      var res = await API.get('/auth/blocked');
      setBlockedUsers(res.data);
    } catch (err) {
      console.error('Fetch blocked error:', err);
    } finally {
      setLoading(false);
    }
  };

  var handleUnblock = async function(userId) {
    try {
      await API.post('/auth/unblock/' + userId);
      setBlockedUsers(blockedUsers.filter(function(u) { return u._id !== userId; }));
    } catch (err) {
      console.error('Unblock error:', err);
    }
  };

  var privacyItems = [
    { icon: '🔒', label: 'Last Seen', desc: 'Nobody' },
    { icon: '📸', label: 'Profile Photo', desc: 'Everybody' },
    { icon: '📞', label: 'Calls', desc: 'Everybody' },
    { icon: '➕', label: 'Groups', desc: 'Everybody' },
    { icon: '🔑', label: 'Two-Step Verification', desc: 'Not set' },
  ];

  return (
    <div className="h-full bg-[#0e1621] flex flex-col">
      <div className="bg-[#17212b] px-3 py-2.5 flex items-center gap-2.5 shrink-0 border-b border-[#1c2e3f]">
        <button onClick={function() { navigate('/settings'); }} className="w-9 h-9 rounded-full flex items-center justify-center text-[#7a8fa6] hover:bg-[#243647] hover:text-white shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-white font-semibold text-[17px]">Privacy and Security</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {privacyItems.map(function(item, i) {
            return (
              <button key={i} className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#17212b]">
                <span className="text-xl w-8 text-center">{item.icon}</span>
                <div className="text-left min-w-0">
                  <p className="text-white text-[14px]">{item.label}</p>
                  <p className="text-[#546778] text-[12px]">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="h-px bg-[#1c2e3f]"></div>
        <div className="py-2">
          <p className="text-[#2AABEE] text-xs font-medium px-5 py-2">BLOCKED USERS</p>
          {loading ? (
            <p className="text-[#546778] text-sm px-5 py-3">Loading...</p>
          ) : blockedUsers.length === 0 ? (
            <p className="text-[#4a6580] text-sm px-5 py-3">No blocked users</p>
          ) : (
            blockedUsers.map(function(blocked) {
              return (
                <div key={blocked._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#e74c3c] to-[#c0392b] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {blocked.fullName && blocked.fullName.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{blocked.fullName}</p>
                    <p className="text-[#546778] text-xs">@{blocked.username}</p>
                  </div>
                  <button onClick={function() { handleUnblock(blocked._id); }} className="text-[#2AABEE] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#243647]">Unblock</button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default PrivacySettings;
