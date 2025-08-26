/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_OAUTH2_BASE_URL: string
  readonly VITE_OAUTH2_CLIENT_ID: string
  readonly VITE_OAUTH2_REDIRECT_URI: string
  readonly VITE_OAUTH2_SCOPE: string
  readonly VITE_OAUTH2_RESPONSE_TYPE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly dirname: string
}