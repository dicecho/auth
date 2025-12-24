import { db } from "@dicecho-auth/db";
import * as schema from "@dicecho-auth/db/schema/auth";
import { env } from "@dicecho-auth/config/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, jwt, magicLink, oAuthProxy } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { sendEmail } from "./email";
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  getVerificationEmailSubject,
  getResetPasswordEmailSubject,
} from "./email-templates";

/**
 * Legacy password format prefix for migrated users.
 * Format: "legacy-md5:{salt}:{md5hash}"
 *
 * When migrating users from the old system, store passwords in this format:
 * `legacy-md5:${user.salt}:${user.password}`
 *
 * This allows the verify function to detect and handle legacy passwords.
 */
const LEGACY_PREFIX = "legacy-md5:";

/**
 * Calculate MD5 hash using Web Crypto API (compatible with Cloudflare Workers)
 * This matches the legacy password hashing: MD5(password + salt)
 */
async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify legacy MD5 password: MD5(password + salt)
 */
async function verifyLegacyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  const calculated = await md5(password + salt);
  return calculated === hash;
}

/**
 * Hash password using scrypt (Better Auth default)
 */
async function hashWithScrypt(password: string): Promise<string> {
  const { hashPassword } = await import("better-auth/crypto");
  return hashPassword(password);
}

/**
 * Verify password using scrypt (Better Auth default)
 */
async function verifyWithScrypt(
  password: string,
  hash: string
): Promise<boolean> {
  const { verifyPassword } = await import("better-auth/crypto");
  return verifyPassword({ password, hash });
}

/**
 * Custom password verification that supports both:
 * 1. Legacy MD5+salt passwords (format: "legacy-md5:{salt}:{md5hash}")
 * 2. Modern scrypt passwords (Better Auth default)
 *
 * For migrating users, store their password as:
 * `legacy-md5:${oldSalt}:${oldMd5Hash}`
 */
async function customVerifyPassword({
  password,
  hash,
}: {
  password: string;
  hash: string;
}): Promise<boolean> {
  // Check if this is a legacy MD5 password
  if (hash.startsWith(LEGACY_PREFIX)) {
    // Parse legacy format: "legacy-md5:{salt}:{md5hash}"
    const parts = hash.slice(LEGACY_PREFIX.length).split(":");
    if (parts.length === 2 && parts[0] && parts[1]) {
      const salt = parts[0];
      const md5Hash = parts[1];
      return verifyLegacyPassword(password, md5Hash, salt);
    }
    return false;
  }

  // Default: verify using scrypt
  return verifyWithScrypt(password, hash);
}

console.log('redirectUri', `${env.BETTER_AUTH_URL}/api/auth/callback/google`)

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
      updateUserInfoOnLink: true
    },
  },
  // JWT session tokens for stateless verification
  session: {
    modelName: "session",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // Support multiple origins (comma-separated in env)
  // Includes web origins and mobile app schemes
  trustedOrigins: [
    // Web origins from env
    ...(env.CORS_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean),
    // Mobile app scheme (配置你的 app scheme)
    "dicecho://",
    // Expo development schemes
    ...(process.env.NODE_ENV === "development"
      ? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
      : []),
  ],
  // OAuth social providers
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      redirectUri: `${env.BETTER_AUTH_URL}/api/auth/callback/google`,
    },
    apple: {
      clientId: env.APPLE_CLIENT_ID || "",
      clientSecret: env.APPLE_CLIENT_SECRET || "",
      enabled: !!(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET),
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
      enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
      redirectUri: `${env.BETTER_AUTH_URL}/api/auth/callback/github`,
    },
  },
  // Cross-origin cookie support for localhost (different ports like 3000 and 3001)
  advanced: {
    defaultCookieAttributes: (() => {
      const isLocal =
        typeof env.BETTER_AUTH_URL === "string" &&
        env.BETTER_AUTH_URL.startsWith("http://localhost");
      
      if (isLocal) {
        // For localhost: share cookies across different ports
        return {
          sameSite: "lax", // lax works for same-site (localhost)
          secure: false,
        } as const;
      }
      
      // Production: strict cross-origin settings
      return {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      } as const;
    })(),
  },
  user: {
    additionalFields: {
      locale: {
        type: "string",
        required: false,
        defaultValue: "en",
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashWithScrypt,
      verify: customVerifyPassword,
    },
    sendResetPassword: async ({ user, url }) => {
      const userWithLocale = user as typeof user & { locale?: string };
      const locale = userWithLocale.locale;
      // Don't await to prevent timing attacks
      await sendEmail({
        to: user.email,
        subject: getResetPasswordEmailSubject(locale),
        html: resetPasswordTemplate(user.name, url, locale),
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const userWithLocale = user as typeof user & { locale?: string };
      const locale = userWithLocale.locale;
      // Don't await to prevent timing attacks
      await sendEmail({
        to: user.email,
        subject: getVerificationEmailSubject(locale),
        html: verifyEmailTemplate(url, locale),
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
    bearer(),
    oAuthProxy(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "完成账户设置",
          html: verifyEmailTemplate(url),
        });
      },
    }),
    jwt({
      jwks: {
        keyPairConfig: {
          alg: "EdDSA", // 使用 EdDSA (Ed25519) - 高性能且安全
          crv: "Ed25519",
        },
      },
      jwt: {
        expirationTime: "7d", // Token 有效期 7 天
        issuer: env.BETTER_AUTH_URL,
        // 支持多个服务验证
        audience: [env.BETTER_AUTH_URL, "dicecho-api", "dicecho-app"],
      },
    }),
    // Expo 移动端支持
    expo(),
  ],
});
