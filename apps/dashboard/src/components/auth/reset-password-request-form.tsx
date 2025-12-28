"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resetPasswordRequestSchema } from "@/lib/schemas";
import { FormSuccess, FormError } from "../ui/form-messages";
import { APP_BASE_URL } from "@/lib/config";
import { authClient } from "@/lib/auth-client";

const ResetPasswordRequestForm = () => {
  const [formState, setFormState] = React.useState<{
    success?: string;
    error?: string;
  }>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (
    data: import("../../lib/schemas").ResetPasswordRequestSchema,
  ) => {
    setFormState({});
    try {
      const result = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${APP_BASE_URL}/auth/reset`,
      });

      if ("error" in result && result.error) {
        setFormState({ error: result.error.message || "Something went wrong." });
        return;
      }

      setFormState({
        success: "If this email exists, you will receive a reset link.",
      });
    } catch {
      setFormState({ error: "Something went wrong." });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-5"
    >
      <FormSuccess message={formState.success || ""} />
      <FormError message={formState.error || ""} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <span className="text-xs text-red-500">{errors.email.message}</span>
        )}
      </div>
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
};

export default ResetPasswordRequestForm;
