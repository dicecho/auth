import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import { adminClient, inferAdditionalFields, jwtClient, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:3000";
const CALLBACK_URL = process.env.NEXT_PUBLIC_CALLBACK_URL || "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [
    adminClient(),
    magicLinkClient(),
    jwtClient(),
    inferAdditionalFields({
      user: {
        locale: {
          type: "string",
        },
      },
    }),
  ],
});

// OAuth 登录方法
export const signInWithGithub = async () => {
  await authClient.signIn.social({
    provider: "github",
    callbackURL: CALLBACK_URL,
  }).catch((error) => {
    console.error("GitHub sign-in failed", error);
  });
};

export const signInWithGoogle = async () => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: CALLBACK_URL,
  }).catch((error) => {
    console.error("Google sign-in failed", error);
  });
};

export const signInWithApple = async () => {
  await authClient.signIn.social({
    provider: "apple",
    callbackURL: CALLBACK_URL,
  }).catch((error) => {
    console.error("Apple sign-in failed", error);
  });
};

// 获取当前会话
export const getSession = async () => {
  return authClient.getSession();
};

// 登出
export const signOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onError: (ctx) => {
        console.error("SignOut error:", ctx.error);
      },
    },
  });
};
