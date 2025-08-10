import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getProfile: () =>
    api.get('/auth/me'),
  
  updateProfile: (profileData) =>
    api.patch('/auth/profile', profileData),
};

// Room API (for future expansion)
export const roomAPI = {
  createRoom: (roomData) =>
    api.post('/rooms', roomData),
  
  getRooms: () =>
    api.get('/rooms'),
  
  getRoom: (roomId) =>
    api.get(`/rooms/${roomId}`),
  
  joinRoom: (roomId) =>
    api.post(`/rooms/${roomId}/join`),
  
  leaveRoom: (roomId) =>
    api.post(`/rooms/${roomId}/leave`),
};

// File API
export const fileAPI = {
  uploadFile: (formData) =>
    api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  downloadFile: (fileId) =>
    api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    }),
  
  deleteFile: (fileId) =>
    api.delete(`/files/${fileId}`),
};

export default api;