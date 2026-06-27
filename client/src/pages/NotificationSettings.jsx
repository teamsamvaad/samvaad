import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function NotificationSettings() {
  var navigate = useNavigate();
  var [notifications, setNotifications] = useState(true);
  var [sounds, setSounds] = useState(true);
  var [preview, setPreview] = useState(true);

  var items = [
    { label: 'Message Notifications', desc: 'Show notifications for new messages', value: notifications, onChange: function() { setNotifications(!notifications); } },
    { label: 'Sounds', desc: 'Play sound for incoming messages', value: sounds, onChange: function() { setSounds(!sounds); } },
    { label: 'Message Preview', desc: 'Show message text in notification', value: preview, onChange: function() { setPreview(!preview); } },
  ];

  return (
    <div className="h-full bg-[#0e1621] flex flex-col">
      <div className="bg-[#17212b] px-3 py-2.5 flex items-center gap-2.5 shrink-0 border-b border-[#1c2e3f]">
        <button onClick={function() { navigate('/settings'); }} className="w-9 h-9 rounded-full flex items-center justify-center text-[#7a8fa6] hover:bg-[#243647] hover:text-white shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-white font-semibold text-[17px]">Notifications and Sounds</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <p className="text-[#2AABEE] text-xs font-medium px-5 py-3">MESSAGES</p>
        <div className="px-5">
          {items.map(function(item, i) {
            return (
              <div key={i} className="flex items-center justify-between py-4 border-b border-[#1c2e3f]">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-white text-[14px]">{item.label}</p>
                  <p className="text-[#546778] text-[12px]">{item.desc}</p>
                </div>
                <button onClick={item.onChange} className={'w-12 h-7 rounded-full transition-colors relative ' + (item.value ? 'bg-[#2AABEE]' : 'bg-[#3a5068]')}>
                  <div className="bg-white rounded-full absolute top-[3px] transition-all shadow-md" style={{ width: '22px', height: '22px', left: item.value ? 'auto' : '3px', right: item.value ? '3px' : 'auto' }}></div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default NotificationSettings;
