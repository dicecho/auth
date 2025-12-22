import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Point directly to the auth service domain; frontends can be many apps.
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL;

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL, // e.g. http://localhost:3000 or https://auth.yourdomain.com
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include", // send cookies cross-origin
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
