import axios from 'axios';

const API = axios.create({
  baseURL: 'https://samvaad-3f6x.onrender.com/api',
});

// Auto attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('samvaad_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
