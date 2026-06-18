/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
