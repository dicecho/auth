"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { emailRegisterSchema } from "@/lib/schemas";
import { FormSuccess, FormError } from "../ui/form-messages";
import { authClient } from "@/lib/auth-client";
import {
  DEFAULT_COMPLETE_REGISTRATION_REDIRECT,
  DEFAULT_LOGIN_REDIRECT,
  APP_BASE_URL,
} from "@/lib/config";

const RegisterForm = () => {
  const [formState, setFormState] = React.useState<{
    success?: string;
    error?: string;
  }>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(emailRegisterSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (
    data: import("../../lib/schemas").EmailRegisterSchema,
  ) => {
    setFormState({});
    const { error } = await authClient.signIn.magicLink({
      email: data.email,
      callbackURL: DEFAULT_LOGIN_REDIRECT,
      newUserCallbackURL: DEFAULT_COMPLETE_REGISTRATION_REDIRECT,
      errorCallbackURL: `${APP_BASE_URL}/auth/register`,
    });
    if (error) {
      setFormState({ error: error.message || "Something went wrong." });
      return;
    }
    setFormState({ success: "Check your email to continue." });
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
        {isSubmitting ? "Sending..." : "Send verification email"}
      </Button>
    </form>
  );
};

export default RegisterForm;
