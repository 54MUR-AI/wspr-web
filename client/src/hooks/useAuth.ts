import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import cryptoService from '../services/crypto.service';

interface User {
  id: string;
  email: string;
  publicKey: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token) => {
        set({ token });
      },

      login: async (email: string, password: string) => {
        try {
          // Initialize crypto service for the user
          await cryptoService.initialize(email, password);

          // Get the user's public key
          const publicKey = await cryptoService.getPublicKey();

          // Make the login request
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              publicKey,
            }),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const { user, token } = await response.json();

          // Update the auth state
          set({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      logout: () => {
        // Clear crypto service state
        cryptoService.cleanup();

        // Clear auth state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

export default useAuth;
