export interface WebAuthnCredential {
  credentialId: string;
  publicKey: string;
  userHandle: string;
}

export interface WebAuthnRegistrationOptions {
  username: string;
  userId: string;
  deviceName?: string;
}

export interface WebAuthnAuthenticationOptions {
  credentialId: string;
}

export interface WebAuthnState {
  isSupported: boolean;
  isRegistering: boolean;
  isAuthenticating: boolean;
  hasPlatformAuthenticator: boolean;
  error: string | null;
}

export interface AuditLogEvent {
  event: string;
  userId?: string;
  credentialId?: string;
  deviceName?: string;
  error?: string;
  success: boolean;
  timestamp?: string;
}
