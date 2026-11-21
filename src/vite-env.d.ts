interface ImportMetaEnv {
  /** Base path the app is served from: "/" in dev, "./" for subpath deploys. */
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
