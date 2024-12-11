import axios from 'axios';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
  };
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username,
      email,
      password,
    });
    return response.data;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password,
    });
    const { token, user } = response.data;
    this.setToken(token);
    return { token, user };
  }

  async startWebAuthnRegistration(username: string): Promise<boolean> {
    try {
      // Get registration options from server
      const optionsRes = await axios.post(
        `${API_URL}/api/auth/webauthn/generate-registration-options`,
        { username }
      );
      
      // Start registration process in browser
      const credential = await startRegistration(optionsRes.data);
      
      // Verify registration with server
      const verificationRes = await axios.post(
        `${API_URL}/api/auth/webauthn/verify-registration`,
        {
          username,
          credential,
        }
      );
      
      return verificationRes.data.verified;
    } catch (error) {
      console.error('WebAuthn registration error:', error);
      throw error;
    }
  }

  async startWebAuthnLogin(username: string): Promise<AuthResponse> {
    try {
      // Get authentication options from server
      const optionsRes = await axios.post(
        `${API_URL}/api/auth/webauthn/generate-authentication-options`,
        { username }
      );
      
      // Start authentication process in browser
      const credential = await startAuthentication(optionsRes.data);
      
      // Verify authentication with server
      const verificationRes = await axios.post(
        `${API_URL}/api/auth/webauthn/verify-authentication`,
        {
          username,
          credential,
        }
      );
      
      const { token, user } = verificationRes.data;
      this.setToken(token);
      return { token, user };
    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      throw error;
    }
  }

  async setupRecoveryKey(): Promise<{ recoveryKey: string }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/recovery-key/generate`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Recovery key setup error:', error);
      throw error;
    }
  }

  async loginWithRecoveryKey(username: string, recoveryKey: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/auth/recovery-key/login`, {
      username,
      recoveryKey,
    });
    const { token, user } = response.data;
    this.setToken(token);
    return { token, user };
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.token = null;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.token = token;
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }
}

export default AuthService.getInstance();
