import { useEffect } from 'react';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import EditProfile from './pages/EditProfile';

function App() {
  const { user, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="h-full bg-[#0e1621] flex items-center justify-center">
        <div className="text-4xl">🗣️</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        <Route path="/chat/:conversationId" element={user ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/settings/profile" element={user ? <EditProfile /> : <Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
