import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - use environment variable or default to localhost
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types matching backend
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio?: string;
  avatar?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Authentication API Service
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    // Store token in AsyncStorage
    await AsyncStorage.setItem('auth_token', response.data.token);
    return response.data;
  },

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    // Store token in AsyncStorage
    await AsyncStorage.setItem('auth_token', response.data.token);
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Logout user (clear token)
   */
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
  },

  /**
   * Check if user has a valid token
   */
  async hasToken(): Promise<boolean> {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  },
};
