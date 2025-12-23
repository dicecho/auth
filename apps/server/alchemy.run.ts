import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });

const app = await alchemy("dicecho-auth");

export const server = await Worker("server", {
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    DATABASE_URL: alchemy.secret.env.DATABASE_URL,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL,
    // OAuth providers
    GOOGLE_CLIENT_ID: alchemy.secret.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: alchemy.secret.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: alchemy.secret.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: alchemy.secret.env.GITHUB_CLIENT_SECRET,
    MAILGUN_API_KEY: alchemy.secret.env.MAILGUN_API_KEY,
    MAILGUN_DOMAIN: alchemy.env.MAILGUN_DOMAIN,
  },
  dev: {
    port: 3000,
  },
});

console.log(`Server -> ${server.url}`);

await app.finalize();
