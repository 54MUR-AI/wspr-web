/**
 * Environment variable utility functions
 */

/**
 * Get environment variable with type checking
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found
 * @returns Environment variable value
 */
export function getEnvVar<T>(key: keyof ImportMetaEnv, defaultValue: T): T {
  const value = import.meta.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }

  // Handle boolean values
  if (typeof defaultValue === 'boolean') {
    return (value === 'true') as T;
  }

  // Handle number values
  if (typeof defaultValue === 'number') {
    return Number(value) as T;
  }

  return value as T;
}

/**
 * Environment configuration object
 */
export const env = {
  // API Configuration
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:3001'),
  wsUrl: getEnvVar('VITE_WS_URL', 'ws://localhost:3001'),

  // Authentication
  jwtSecret: getEnvVar('VITE_JWT_SECRET', 'dev-jwt-secret-123'),

  // Push Notifications
  vapidPublicKey: getEnvVar('VITE_VAPID_PUBLIC_KEY', ''),

  // Media Configuration
  maxFileSize: getEnvVar('VITE_MAX_FILE_SIZE', 10485760),
  allowedFileTypes: getEnvVar('VITE_ALLOWED_FILE_TYPES', 'image/*,video/*,audio/*,application/pdf'),

  // Feature Flags
  enableVideoCalls: getEnvVar('VITE_ENABLE_VIDEO_CALLS', true),
  enableFileSharing: getEnvVar('VITE_ENABLE_FILE_SHARING', true),
  enableGroupChat: getEnvVar('VITE_ENABLE_GROUP_CHAT', true),

  // Analytics and Monitoring
  sentryDsn: getEnvVar('VITE_SENTRY_DSN', ''),
  analyticsId: getEnvVar('VITE_ANALYTICS_ID', ''),

  // Cache Configuration
  cacheVersion: getEnvVar('VITE_CACHE_VERSION', 1),
  cacheMaxAge: getEnvVar('VITE_CACHE_MAX_AGE', 86400),

  /**
   * Check if we're in development mode
   */
  isDevelopment: import.meta.env.DEV,

  /**
   * Check if we're in production mode
   */
  isProduction: import.meta.env.PROD,

  /**
   * Get the current mode
   */
  mode: import.meta.env.MODE,

  /**
   * Get the base URL
   */
  baseUrl: import.meta.env.BASE_URL
};
