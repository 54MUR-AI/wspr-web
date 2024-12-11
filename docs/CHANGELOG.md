# Changelog

All notable changes to the WSPR Web project will be documented in this file.

## [Unreleased]

### Added
- Enhanced WebAuthn implementation
  * Device metadata tracking (type, name, backup state)
  * Transport preference support
  * Counter validation for replay protection
  * Challenge-based authentication flow
- Improved database schema
  * Added currentChallenge to User model
  * Enhanced Authenticator model with device metadata
  * Added unique constraint on credentialID
- Type-safe authentication endpoints
  * Strong TypeScript types for request/response
  * Comprehensive error handling
  * Detailed error messages
- Development environment improvements
  * PostgreSQL on port 5433 for compatibility
  * Updated environment variables
  * Improved startup scripts
- WebAuthn authentication support
  * Platform authenticator (biometric) support
  * Security key support
  * Browser compatibility detection
- Recovery key system
  * Secure key generation
  * Key verification and invalidation
  * Metadata tracking
- Modern authentication UI components
  * WebAuthn registration and login
  * Recovery key setup and login
  * Error handling and feedback
- Updated User model with authentication fields
- Database migrations for new authentication features
- Comprehensive authentication documentation

### Changed
- Enhanced security with WebAuthn integration
- Improved user authentication experience
- Updated authentication flow with multiple methods
- Modernized UI components with Tailwind CSS
- Refactored authentication routes for better type safety
- Updated database connection handling
- Improved error handling and logging

### Security
- Added cryptographically secure key generation
- Implemented secure key storage and hashing
- Added comprehensive security event logging
- Enhanced browser compatibility checks
- Added rate limiting and brute force protection
- Improved WebAuthn security features
  * Device backup state verification
  * Transport security validation
  * Counter replay protection
  * Challenge freshness validation

## [1.0.0] - 2024-01-01

### Added
- Initial release of WSPR Web
- End-to-end encryption
- Group messaging
- File sharing
- User profiles
- Basic authentication

### Security
- AES-GCM encryption
- Perfect forward secrecy
- Secure key storage
- Audit logging
- Threat detection
