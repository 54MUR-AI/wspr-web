import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/typescript-types';

export class BiometricAuthService {
    private static instance: BiometricAuthService;
    private isAvailable: boolean = false;

    private constructor() {
        this.checkBiometricAvailability();
    }

    public static getInstance(): BiometricAuthService {
        if (!BiometricAuthService.instance) {
            BiometricAuthService.instance = new BiometricAuthService();
        }
        return BiometricAuthService.instance;
    }

    private async checkBiometricAvailability(): Promise<void> {
        try {
            // Check if WebAuthn is supported
            if (!window.PublicKeyCredential) {
                this.isAvailable = false;
                return;
            }

            // Check if platform authenticator is available (biometric sensors)
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            this.isAvailable = available;
        } catch (error) {
            console.error('Error checking biometric availability:', error);
            this.isAvailable = false;
        }
    }

    public async isBiometricAvailable(): Promise<boolean> {
        return this.isAvailable;
    }

    public async registerBiometric(
        username: string,
        displayName: string
    ): Promise<boolean> {
        try {
            if (!this.isAvailable) {
                throw new Error('Biometric authentication is not available on this device');
            }

            // Request options from server (you'll need to implement this endpoint)
            const response = await fetch('/api/auth/biometric/register/options', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, displayName }),
            });

            const options: PublicKeyCredentialCreationOptionsJSON = await response.json();

            // Create biometric credential
            const credential = await navigator.credentials.create({
                publicKey: {
                    ...options,
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform',
                        userVerification: 'required',
                        requireResidentKey: true
                    }
                }
            } as any);

            if (!credential) {
                throw new Error('Failed to create biometric credential');
            }

            // Send verification to server
            const verificationResponse = await fetch('/api/auth/biometric/register/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credential)
            });

            return verificationResponse.ok;
        } catch (error) {
            console.error('Error registering biometric:', error);
            throw error;
        }
    }

    public async authenticateWithBiometric(): Promise<boolean> {
        try {
            if (!this.isAvailable) {
                throw new Error('Biometric authentication is not available on this device');
            }

            // Get authentication options from server
            const response = await fetch('/api/auth/biometric/authenticate/options', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const options = await response.json();

            // Create authentication credential
            const assertion = await navigator.credentials.get({
                publicKey: {
                    ...options,
                    userVerification: 'required'
                }
            });

            if (!assertion) {
                throw new Error('Failed to get biometric assertion');
            }

            // Verify with server
            const verificationResponse = await fetch('/api/auth/biometric/authenticate/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(assertion)
            });

            return verificationResponse.ok;
        } catch (error) {
            console.error('Error authenticating with biometric:', error);
            throw error;
        }
    }

    public async removeBiometric(): Promise<boolean> {
        try {
            const response = await fetch('/api/auth/biometric/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Error removing biometric:', error);
            throw error;
        }
    }
}
