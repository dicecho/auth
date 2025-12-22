import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Frontend-only Better Auth client that talks to the external server.
// baseURL must point to the deployed Workers API (e.g. https://xxx.workers.dev)
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL;

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  basePath: "/api/auth",
  fetchOptions: {
    // Always forward cookies to the auth server.
    credentials: "include",
  },
  plugins: [adminClient()],
});

export const signInWithGithub = async () => {
  await authClient.signIn.social({
    provider: "github",
    callbackURL: DEFAULT_LOGIN_REDIRECT,
  });
};

export const signInWithGoogle = async () => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: DEFAULT_LOGIN_REDIRECT,
  });
};
