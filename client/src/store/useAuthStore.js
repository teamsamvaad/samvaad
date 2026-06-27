import { create } from 'zustand';
import API from '../lib/axios';

const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  // Check if user is already logged in
  checkAuth: () => {
    const token = localStorage.getItem('samvaad_token');
    const savedUser = localStorage.getItem('samvaad_user');
    if (token && savedUser) {
      set({ user: JSON.parse(savedUser), isLoading: false });
    } else {
      set({ user: null, isLoading: false });
    }
  },

  // Signup
  signup: async (fullName, username, email, password) => {
    const res = await API.post('/auth/signup', {
      fullName,
      username,
      email,
      password,
    });
    localStorage.setItem('samvaad_token', res.data.token);
    localStorage.setItem('samvaad_user', JSON.stringify(res.data.user));
    set({ user: res.data.user });
    return res.data;
  },

  // Login
  login: async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    localStorage.setItem('samvaad_token', res.data.token);
    localStorage.setItem('samvaad_user', JSON.stringify(res.data.user));
    set({ user: res.data.user });
    return res.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('samvaad_token');
    localStorage.removeItem('samvaad_user');
    set({ user: null });
  },
}));

export default useAuthStore;
