/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_APP_URL: string
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}