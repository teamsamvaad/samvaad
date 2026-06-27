import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const settingsItems = [
    { icon: '🔔', label: 'Notifications and Sounds', desc: 'Message alerts & sounds' },
    { icon: '🔒', label: 'Privacy and Security', desc: 'Blocked users, 2FA' },
    { icon: '💬', label: 'Chat Settings', desc: 'Theme, wallpaper, font size' },
    { icon: '📱', label: 'Devices', desc: 'Active sessions' },
    { icon: '📁', label: 'Data and Storage', desc: 'Network usage, storage' },
    { icon: '🌐', label: 'Language', desc: 'English' },
  ];

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
        <h1 className="text-white font-semibold text-[17px]">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Card */}
        <button
          onClick={() => navigate('/settings/profile')}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#17212b] transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
            {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
          </div>
          <div className="text-left min-w-0">
            <p className="text-white font-semibold text-[16px]">{user?.fullName}</p>
            <p className="text-[#7a8fa6] text-sm">@{user?.username}</p>
            <p className="text-[#546778] text-xs mt-0.5">{user?.email}</p>
          </div>
          <svg className="text-[#4a6580] shrink-0 ml-auto" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        {/* Divider */}
        <div className="h-px bg-[#1c2e3f]"></div>

        {/* Settings Items */}
        <div className="py-1">
          {settingsItems.map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#17212b] transition-colors"
            >
              <span className="text-xl w-8 text-center">{item.icon}</span>
              <div className="text-left min-w-0">
                <p className="text-white text-[14px]">{item.label}</p>
                <p className="text-[#546778] text-[12px]">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#1c2e3f]"></div>

        {/* App Info */}
        <div className="px-5 py-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center mb-3 shadow-md">
            <span className="text-2xl">🗣️</span>
          </div>
          <p className="text-[#7a8fa6] text-sm font-medium">Samvaad</p>
          <p className="text-[#3a5068] text-xs mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
