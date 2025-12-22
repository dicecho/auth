import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Point directly to the auth service domain; frontends can be many apps.
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL;

// Token storage key
const TOKEN_KEY = "auth_token";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL, // e.g. http://localhost:3000 or https://auth.yourdomain.com
  basePath: "/api/auth",
  plugins: [
    adminClient(),
    inferAdditionalFields({
      user: {
        locale: {
          type: "string",
        },
      },
    }),
  ],
  fetchOptions: {
    // Disable cookies - use bearer token instead
    credentials: "omit",
    // Use bearer token instead of cookies
    onRequest: (ctx) => {
      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (token) {
        ctx.headers.set("Authorization", `Bearer ${token}`);
      }
    },
    // Store token from response
    onSuccess: async (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token && typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
      }
    },
  },
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

// Clear token on sign out
export const signOut = async () => {
  await authClient.signOut();
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
};
