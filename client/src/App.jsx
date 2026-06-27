import { useEffect } from 'react';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import EditProfile from './pages/EditProfile';
import SavedMessages from './pages/SavedMessages';
import Contacts from './pages/Contacts';
import Calls from './pages/Calls';
import PrivacySettings from './pages/PrivacySettings';
import NotificationSettings from './pages/NotificationSettings';

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
        <Route path="/settings/privacy" element={user ? <PrivacySettings /> : <Navigate to="/login" />} />
        <Route path="/settings/notifications" element={user ? <NotificationSettings /> : <Navigate to="/login" />} />
        <Route path="/saved" element={user ? <SavedMessages /> : <Navigate to="/login" />} />
        <Route path="/contacts" element={user ? <Contacts /> : <Navigate to="/login" />} />
        <Route path="/calls" element={user ? <Calls /> : <Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
