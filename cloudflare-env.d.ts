// Declaration merge for @opennextjs/cloudflare's getCloudflareContext(), whose
// CloudflareEnv type is separate from the Env/Cloudflare.Env that `wrangler types`
// generates into worker-configuration.d.ts.
export {};

declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}
