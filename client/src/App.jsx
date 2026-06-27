function App() {
  return (
    <div className="min-h-screen bg-[#0e1621] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🗣️</div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Samvaad
        </h1>
        <p className="text-[#7a8fa6] text-lg mb-8">
          Connect. Chat. Communicate.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-[#2AABEE] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#229ED9] transition-colors">
            Login
          </button>
          <button className="bg-transparent text-[#2AABEE] border border-[#2AABEE] px-6 py-3 rounded-lg font-medium hover:bg-[#2AABEE] hover:text-white transition-colors">
            Sign Up
          </button>
        </div>
        <p className="text-[#546778] text-sm mt-8">
          Server Status: 
          <span className="text-green-400 ml-1">● Connected</span>
        </p>
      </div>
    </div>
  );
}

export default App;
