import useAuthStore from '../store/useAuthStore';

function Home() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-[#0e1621] flex flex-col">
      {/* Header */}
      <div className="bg-[#17212b] px-4 py-3 flex items-center justify-between border-b border-[#2b5278]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2AABEE] rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.fullName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-white font-semibold">{user?.fullName}</h2>
            <p className="text-[#7a8fa6] text-sm">@{user?.username}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-[#7a8fa6] hover:text-red-400 text-sm"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🗣️</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to Samvaad!
          </h2>
          <p className="text-[#7a8fa6] mb-4">
            You are logged in as <span className="text-[#2AABEE]">{user?.email}</span>
          </p>
          <p className="text-[#546778] text-sm">
            Chat features coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
