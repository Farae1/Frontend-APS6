/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend URL; empty uses the mocked backend. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
