import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import API from '../lib/axios';

function EditProfile() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await API.put('/auth/profile', {
        fullName,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio,
      });

      // Update local storage
      const savedUser = JSON.parse(localStorage.getItem('samvaad_user'));
      const updatedUser = { ...savedUser, ...res.data.user };
      localStorage.setItem('samvaad_user', JSON.stringify(updatedUser));
      useAuthStore.getState().checkAuth();

      setSuccess('Profile updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#0e1621] flex flex-col">
      {/* Header */}
      <div className="bg-[#17212b] px-3 py-2.5 flex items-center gap-2.5 shrink-0 border-b border-[#1c2e3f]">
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#7a8fa6] hover:bg-[#243647] hover:text-white shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-white font-semibold text-[17px]">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="ml-auto text-[#2AABEE] font-semibold text-[15px] disabled:opacity-50"
        >
          {loading ? '...' : 'Done'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar */}
        <div className="flex justify-center py-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2AABEE] to-[#1d8bc4] flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#2AABEE] rounded-full flex items-center justify-center text-white shadow-md border-2 border-[#0e1621]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-4 mb-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-sm">{error}</div>
        )}
        {success && (
          <div className="mx-4 mb-3 bg-[#2ecc71]/10 border border-[#2ecc71]/30 text-[#2ecc71] px-4 py-2.5 rounded-xl text-sm">{success}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="px-5 space-y-5">
          <div className="space-y-1">
            <label className="text-[#2AABEE] text-xs font-medium">Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-0 py-2 bg-transparent border-b border-[#243647] text-white focus:outline-none focus:border-[#2AABEE] text-[15px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#2AABEE] text-xs font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full px-0 py-2 bg-transparent border-b border-[#243647] text-white focus:outline-none focus:border-[#2AABEE] text-[15px]"
            />
            <p className="text-[#3a5068] text-[11px]">Only lowercase, numbers & underscore</p>
          </div>

          <div className="space-y-1">
            <label className="text-[#2AABEE] text-xs font-medium">Bio</label>
            <input
              type="text"
              placeholder="A little about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={70}
              className="w-full px-0 py-2 bg-transparent border-b border-[#243647] text-white placeholder-[#3a5068] focus:outline-none focus:border-[#2AABEE] text-[15px]"
            />
            <p className="text-[#3a5068] text-[11px]">{bio.length}/70</p>
          </div>

          <div className="space-y-1">
            <label className="text-[#2AABEE] text-xs font-medium">Email</label>
            <input
              type="text"
              value={user?.email || ''}
              disabled
              className="w-full px-0 py-2 bg-transparent border-b border-[#1c2e3f] text-[#4a6580] text-[15px]"
            />
            <p className="text-[#3a5068] text-[11px]">Email cannot be changed</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
