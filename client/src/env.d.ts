/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_JWT_SECRET: string
  readonly VITE_VAPID_PUBLIC_KEY: string
  readonly VITE_MAX_FILE_SIZE: number
  readonly VITE_ALLOWED_FILE_TYPES: string
  readonly VITE_ENABLE_VIDEO_CALLS: boolean
  readonly VITE_ENABLE_FILE_SHARING: boolean
  readonly VITE_ENABLE_GROUP_CHAT: boolean
  readonly VITE_SENTRY_DSN: string
  readonly VITE_ANALYTICS_ID: string
  readonly VITE_CACHE_VERSION: number
  readonly VITE_CACHE_MAX_AGE: number
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
