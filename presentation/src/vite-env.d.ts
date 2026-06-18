/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  readonly VITE_POC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
