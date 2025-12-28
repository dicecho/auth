"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PasswordInput from "./password-input";
import { resetPasswordSchema } from "@/lib/schemas";
import { FormSuccess, FormError } from "../ui/form-messages";
import { authClient } from "@/lib/auth-client";

type ResetPasswordFormProps = {
  token: string;
};

const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const router = useRouter();
  const [formState, setFormState] = React.useState<{
    success?: string;
    error?: string;
  }>({});

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (
    data: import("../../lib/schemas").ResetPasswordSchema,
  ) => {
    setFormState({});
    try {
      const result = await authClient.resetPassword({
        token,
        newPassword: data.password,
      });

      if ("error" in result && result.error) {
        setFormState({
          error: result.error.message || "Invalid or expired token.",
        });
        return;
      }

      setFormState({ success: "Password updated. You can sign in now." });
      router.push("/auth/login");
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
        <Label htmlFor="password">New Password</Label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput
              value={field.value}
              onChange={field.onChange}
              id="password"
            />
          )}
        />
        {errors.password && (
          <span className="text-xs text-red-500">
            {errors.password.message}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <PasswordInput
              value={field.value}
              onChange={field.onChange}
              id="confirmPassword"
            />
          )}
        />
        {errors.confirmPassword && (
          <span className="text-xs text-red-500">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Reset password"}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
