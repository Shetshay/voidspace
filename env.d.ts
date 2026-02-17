// Cloudflare env bindings — typed loosely to avoid conflicts with global DOM types
interface CloudflareEnv {
  DB: unknown;
  R2: unknown;
  JWT_SECRET: string;
  ASSETS: unknown;
}
