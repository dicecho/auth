"use client";

import { authClient } from "@/lib/auth-client";
import { ActionResult } from "@/lib/schemas";

export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<ActionResult<{ user: { id: string; email: string } }>> {
  const { error } = await authClient.signIn.email({
    email,
    password,
  });

  if (error) {
    return {
      error: { reason: error.message ?? "Something went wrong." },
      success: null,
    };
  }

  return {
    success: { reason: "Login successful" },
    error: null,
    data: undefined,
  };
}
