// Unified env loader for both Cloudflare Workers runtime and local Node tools (CLI/migrations).
// - In Workers: use `cloudflare:workers` bindings (env is object or function).
// - In Node/CLI: load dotenv and return process.env.

let env: Record<string, string | undefined> | undefined;

const isNode = typeof process !== "undefined" && !!process.versions?.node;

// Load dotenv only in Node/CLI
if (isNode) {
  try {
    const { config } = await import("dotenv");
    config({ path: "./.env", override: false });
    config({ path: "../../apps/server/.env", override: false });
  } catch {
    /* ignore */
  }
}

// Try Cloudflare bindings
try {
  const cf = await import("cloudflare:workers");
  const maybeEnv = typeof cf.env === "function" ? cf.env() : cf.env;
  if (maybeEnv && typeof maybeEnv === "object") {
    env = maybeEnv as any;
  }
} catch {
  /* not in workers */
}

if (!env) {
  env = (isNode ? process.env : {}) as any;
}

export { env };
