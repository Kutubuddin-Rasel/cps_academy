import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    const { data } = await api.post('/api/auth/local/register', {
      username,
      email,
      password,
    });
    // Store token with consistent expiry
    Cookies.set('token', data.jwt, { expires: 30, path: '/', sameSite: 'lax' });
    return data;
  },

  login: async (identifier: string, password: string) => {
    const { data } = await api.post('/api/auth/local', {
      identifier,
      password,
    });
    // Store token with consistent expiry
    Cookies.set('token', data.jwt, { expires: 30, path: '/', sameSite: 'lax' });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/api/users/me?populate=role');
    return data;
  },
};

export const courseAPI = {
  getAll: async () => {
    const { data } = await api.get('/api/courses?populate=*');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/api/courses/${id}?populate[modules][populate]=classes`);
    return data;
  },
};

export default api;
