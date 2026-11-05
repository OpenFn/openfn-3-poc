/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "lightning" sends the API client to a real Lightning; anything else uses the fake server in src/fake-api/. */
  readonly VITE_API?: string;
}
