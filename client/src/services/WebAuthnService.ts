import axios from 'axios';
import { 
  startRegistration,
  startAuthentication
} from '@simplewebauthn/browser';

class WebAuthnService {
  private static instance: WebAuthnService;
  private baseUrl: string = '/api/auth';

  private constructor() {}

  public static getInstance(): WebAuthnService {
    if (!WebAuthnService.instance) {
      WebAuthnService.instance = new WebAuthnService();
    }
    return WebAuthnService.instance;
  }

  async register(email: string, name: string): Promise<string> {
    try {
      // Get registration options from server
      const { data: options } = await axios.post(`${this.baseUrl}/webauthn/register/options`, { email, name });

      // Start client-side registration
      const attResp = await startRegistration(options);

      // Send response to server for verification
      const { data: { token } } = await axios.post(`${this.baseUrl}/webauthn/register/verify`, {
        email,
        response: attResp
      });

      return token;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string): Promise<string> {
    try {
      // Get authentication options from server
      const { data: options } = await axios.post(`${this.baseUrl}/webauthn/login/options`, { email });

      // Start client-side authentication
      const asseResp = await startAuthentication(options);

      // Send response to server for verification
      const { data: { token } } = await axios.post(`${this.baseUrl}/webauthn/login/verify`, {
        email,
        response: asseResp
      });

      return token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  isWebAuthnSupported(): boolean {
    return window.PublicKeyCredential !== undefined &&
           typeof window.PublicKeyCredential === 'function';
  }

  isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isWebAuthnSupported()) {
      return Promise.resolve(false);
    }
    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }
}

export default WebAuthnService;
