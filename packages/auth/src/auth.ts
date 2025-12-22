import { db } from "@dicecho-auth/db";
import * as schema from "@dicecho-auth/db/schema/auth";
import { env } from "@dicecho-auth/config/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
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

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  // dev helpers: relax cookies when running on http://localhost to allow local testing
  // Note: Chrome requires Secure when SameSite=None, so switch to Lax for localhost.
  advanced: {
    defaultCookieAttributes: (() => {
      const isLocal =
        typeof env.BETTER_AUTH_URL === "string" &&
        env.BETTER_AUTH_URL.startsWith("http://localhost");
      return {
        sameSite: isLocal ? "lax" : "none",
        secure: isLocal ? false : true,
        httpOnly: true,
      } as const;
    })(),
    // uncomment crossSubDomainCookies setting when ready to deploy and replace <your-workers-subdomain> with your actual workers subdomain
    // https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
    // crossSubDomainCookies: {
    //   enabled: true,
    //   domain: "<your-workers-subdomain>",
    // },
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
      void sendEmail({
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
      void sendEmail({
        to: user.email,
        subject: getVerificationEmailSubject(locale),
        html: verifyEmailTemplate(url, locale),
      });
    },
    sendOnSignUp: true,
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })]
});
