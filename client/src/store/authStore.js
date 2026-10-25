import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('apartmenthub_user') || 'null'),
  token: localStorage.getItem('apartmenthub_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success) {
        localStorage.setItem('apartmenthub_token', res.data.token);
        localStorage.setItem('apartmenthub_user', JSON.stringify(res.data.user));
        set({ user: res.data.user, token: res.data.token, isLoading: false });
        return { success: true, role: res.data.user.role };
      }
    } catch (err) {
      set({ error: err.message || 'Login failed', isLoading: false });
      return { success: false, error: err.message || 'Login failed' };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', userData);
      set({ isLoading: false });
      return { success: true, message: res.message };
    } catch (err) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      return { success: false, error: err.message || 'Registration failed' };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Continue client cleanup regardless
    }
    localStorage.removeItem('apartmenthub_token');
    localStorage.removeItem('apartmenthub_user');
    set({ user: null, token: null });
  },

  updateUserProfile: (updatedUser) => {
    localStorage.setItem('apartmenthub_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));

export const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('apartmenthub_theme') === 'dark',
  toggleTheme: () => {
    set((state) => {
      const nextTheme = !state.isDark;
      if (nextTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('apartmenthub_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('apartmenthub_theme', 'light');
      }
      return { isDark: nextTheme };
    });
  },
  initTheme: () => {
    const isDark = localStorage.getItem('apartmenthub_theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
