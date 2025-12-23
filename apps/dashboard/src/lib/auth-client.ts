import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import { adminClient, inferAdditionalFields, jwtClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Point directly to the auth service domain; frontends can be many apps.
const JWT_KEY = "auth_jwt";
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:3000";

const buildCallbackURL = () => {
  if (typeof window === "undefined") return DEFAULT_LOGIN_REDIRECT;
  try {
    return new URL(DEFAULT_LOGIN_REDIRECT, window.location.origin).toString();
  } catch {
    return DEFAULT_LOGIN_REDIRECT;
  }
};

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL, // e.g. http://localhost:3000 or https://auth.yourdomain.com
  basePath: "/api/auth",
  plugins: [
    adminClient(),
    jwtClient(),
    inferAdditionalFields({
      user: {
        locale: {
          type: "string",
        },
      },
    }),
  ],
  fetchOptions: {
    // Use cookies for session (supports both email/password and OAuth)
    credentials: "include",
    onRequest: (ctx) => {
      const jwt = typeof window !== "undefined" ? localStorage.getItem(JWT_KEY) : null;
      if (jwt) {
        ctx.headers.set("Authorization", `Bearer ${jwt}`);
      }
    },
    // Store token from response
    onSuccess: async (ctx) => {

      const jwt = ctx.response.headers.get("set-auth-jwt")
      if (jwt && typeof window !== "undefined") {
        localStorage.setItem(JWT_KEY, jwt);
        console.log('jwt', jwt)
      }
    },
  },
});

export const signInWithGithub = async () => {
  await authClient
    .signIn.social({
      provider: "github",
      callbackURL: buildCallbackURL(),
    })
    .catch((error) => {
      console.error("GitHub sign-in failed", error);
    });
};

export const signInWithGoogle = async () => {
  await authClient
    .signIn.social({
      provider: "google",
      callbackURL: buildCallbackURL(),
    })
    .catch((error) => {
      console.error("Google sign-in failed", error);
    });
};

export const signInWithApple = async () => {
  await authClient
    .signIn.social({
      provider: "apple",
      callbackURL: buildCallbackURL(),
    })
    .catch((error) => {
      console.error("Apple sign-in failed", error);
    });
};

export const getSession = async () => {
  const session = await authClient.getSession({
    fetchOptions: {
      onRequest: (ctx) => {
        const jwt = typeof window !== "undefined" ? localStorage.getItem(JWT_KEY) : null;
        if (jwt) {
          ctx.headers.set("Authorization", `Bearer ${jwt}`);
        }
      },
      onSuccess: (ctx) => {
        const jwt = ctx.response.headers.get("set-auth-jwt");
        if (jwt && typeof window !== "undefined") {
          localStorage.setItem(JWT_KEY, jwt);
          console.log('jwt', jwt)
        }
      },
    },
  });
  return session;
};

export const signOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        // Session cleared successfully
      },
      onError: (ctx) => {
        console.error("SignOut error:", ctx.error);
      },
    },
  });
};
