# WSPR Web Authentication System

## Overview
WSPR Web implements a comprehensive, privacy-first authentication system with support for WebAuthn, biometric authentication, and recovery keys. The system is designed to provide maximum security while maintaining an excellent user experience.

## Features

### WebAuthn Authentication
- Platform authenticator support (biometrics)
- Cross-platform authenticator support (security keys)
- Browser compatibility detection
- Automatic fallback mechanisms
- Comprehensive error handling
- Device metadata tracking
- Transport preference support
- Backup state awareness

### Recovery Key System
- 192-bit cryptographically secure keys
- Base32 encoding for readability
- Secure key hashing and storage
- Key metadata tracking
- Key invalidation support

### User Interface
- Modern, responsive design
- Clear user instructions
- Real-time feedback
- Loading states
- Error handling
- Accessibility support

## Technical Implementation

### Server-Side Components

#### Database Schema

##### User Model
```prisma
model User {
  id               String          @id @default(cuid())
  email            String          @unique
  name             String
  currentChallenge String?         @db.Text
  authenticators   Authenticator[]
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
}
```

##### Authenticator Model
```prisma
model Authenticator {
  id                  String   @id @default(cuid())
  credentialID        Bytes
  credentialPublicKey Bytes
  counter            Int
  deviceType         String?
  backedUp           Boolean   @default(false)
  deviceName         String?
  transports         String[]
  user              User     @relation(fields: [userId], references: [id])
  userId            String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([credentialID])
}
```

#### Controllers

1. WebAuthn Controller
   - Registration options generation
   - Registration verification with device metadata
   - Authentication options generation with transport preferences
   - Authentication verification with counter validation
   - Challenge management
   - Device backup state tracking

2. Recovery Key Controller
   - Key generation
   - Key verification
   - Key invalidation
   - Metadata management

### API Endpoints

#### WebAuthn Registration
```typescript
POST /api/auth/webauthn/register/options
Request: {
  email: string;
  name: string;
}
Response: PublicKeyCredentialCreationOptions

POST /api/auth/webauthn/register/verify
Request: {
  email: string;
  response: RegistrationResponseJSON;
}
Response: {
  token: string;
}
```

#### WebAuthn Authentication
```typescript
POST /api/auth/webauthn/login/options
Request: {
  email: string;
}
Response: PublicKeyCredentialRequestOptions

POST /api/auth/webauthn/login/verify
Request: {
  email: string;
  response: AuthenticationResponseJSON;
}
Response: {
  token: string;
}
```

### Security Considerations

#### WebAuthn Configuration
- RP ID validation
- Origin verification
- User verification requirement
- Attestation handling
- Transport security
- Counter validation
- Challenge freshness
- Device backup state verification

#### Token Management
- JWT-based session tokens
- Secure token generation
- Token expiration
- Token refresh mechanism
- Token revocation support

#### Error Handling
- Detailed error messages for debugging
- User-friendly error responses
- Security event logging
- Rate limiting
- Brute force protection

### Development Environment

#### Configuration
```env
NODE_ENV=development
PORT=3001
ORIGIN=http://localhost:3000
RP_ID=localhost
RP_NAME=WSPR Web
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/wspr
JWT_SECRET=wspr-dev-secret-key-change-in-production
```

#### Database Setup
- PostgreSQL on port 5433
- Prisma ORM for type safety
- Automated migrations
- Data seeding support

## Browser Support

### Supported Browsers
- Chrome 67+
- Firefox 60+
- Edge 79+
- Safari 13+
- Opera 54+

### Feature Detection
- WebAuthn API availability check
- Platform authenticator support detection
- Security key compatibility check
- Transport availability verification

## Error Handling

### Common Error Scenarios
1. Browser incompatibility
2. No authenticator available
3. User cancellation
4. Network issues
5. Invalid credentials
6. Expired challenge
7. Counter mismatch
8. Device backup state change

### Error Response Format
```typescript
{
  code: string;
  message: string;
  details?: {
    field?: string;
    reason?: string;
    suggestion?: string;
  };
}
```

## Future Improvements

### Planned Features
1. Multi-device synchronization
2. Authenticator management UI
3. Security event notifications
4. Backup reminder system
5. Transport preference persistence
6. Device nickname support
7. Usage analytics
8. Enhanced error recovery
