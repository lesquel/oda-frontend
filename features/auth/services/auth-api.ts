import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mapAuthResponseDTO, mapUserDTO } from '../mappers/auth-mapper';
import type { AuthResponseDTO, UserDTO } from '../types/auth-dto';

// API base URL - use environment variable or default to localhost
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

// Storage keys
const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include access token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
        apiClient.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Types matching backend
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio?: string;
  avatar?: string;
  avatar_url?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  role?: string;
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
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

const storeTokens = async (res: AuthResponse) => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, res.access_token);
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, res.refresh_token);
};

/**
 * Authentication API Service
 */
export const authApi = {
  /** Register a new user */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const payload = {
      email: data.email,
      username: data.username,
      password: data.password,
    };
    const response = await apiClient.post<AuthResponseDTO>('/auth/register', payload);
    const mapped = mapAuthResponseDTO(response.data);
    await storeTokens(mapped);
    return mapped;
  },

  /** Login user */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponseDTO>('/auth/login', data);
    const mapped = mapAuthResponseDTO(response.data);
    await storeTokens(mapped);
    return mapped;
  },

  /** Get current user profile */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<UserDTO>('/me');
    return mapUserDTO(response.data);
  },

  /** Logout user: revokes refresh token on server and clears local storage */
  async logout(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
      // best-effort
    } finally {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    }
  },

  /** Check if user has a stored access token */
  async hasToken(): Promise<boolean> {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    return !!token;
  },
};
