"use server";

import { authClient } from "@/lib/auth-client";
import { APIError } from "better-auth/api";
import { ActionResult } from "@/lib/schemas";
import { registerSchema, RegisterSchema } from "@/lib/schemas";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";

export async function registerUser(
  formData: RegisterSchema,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      success: null,
      error: { reason: parsed.error.issues[0]?.message || "Invalid input" },
    };
  }

  const { email, password, name } = parsed.data;

  try {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
      locale: "en",
      callbackURL: DEFAULT_LOGIN_REDIRECT,
    });

    if ("error" in result && result.error) {
      const errorMessage = result.error.message ?? "Something went wrong.";
      if (errorMessage.includes("already exists") || errorMessage.includes("UNPROCESSABLE_ENTITY")) {
        return { error: { reason: "User already exists." }, success: null };
      }
      if (errorMessage.includes("BAD_REQUEST") || errorMessage.includes("Invalid")) {
        return { error: { reason: "Invalid email." }, success: null };
      }
      return { error: { reason: errorMessage }, success: null };
    }

    const user = "data" in result && result.data ? result.data.user : null;
    if (!user) {
      return { error: { reason: "Failed to create user." }, success: null };
    }

    return {
      success: {
        reason:
          "Registration successful! Check your email to confirm your account.",
      },
      error: null,
      data: { user: { id: user.id, email: user.email } },
    };
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.status) {
        case "UNPROCESSABLE_ENTITY":
          return { error: { reason: "User already exists." }, success: null };
        case "BAD_REQUEST":
          return { error: { reason: "Invalid email." }, success: null };
        default:
          return { error: { reason: "Something went wrong." }, success: null };
      }
    }

    return { error: { reason: "Something went wrong." }, success: null };
  }
}
