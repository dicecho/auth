"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { completeRegistrationSchema } from "@/lib/schemas";
import { FormSuccess, FormError } from "../ui/form-messages";
import { authClient } from "@/lib/auth-client";

const CompleteRegistrationForm = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [formState, setFormState] = React.useState<{
    success?: string;
    error?: string;
  }>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: { name: session?.user?.name || session?.user.email.split('@')[0] || '' },
  });

  const onSubmit = async (
    data: import("../../lib/schemas").CompleteRegistrationSchema,
  ) => {
    setFormState({});
    const updateResult = await authClient.updateUser({
      name: data.name,
    });
    if ("error" in updateResult && updateResult.error) {
      setFormState({
        error: updateResult.error.message || "Failed to update user.",
      });
      return;
    }

    setFormState({ success: "Account setup complete." });
      router.push("/");
  };

  if (!isPending && !session) {
    return (
      <div className="text-sm text-muted-foreground">
        Session missing. Please open the verification link again.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-5"
    >
      <FormSuccess message={formState.success || ""} />
      <FormError message={formState.error || ""} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Username</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your username"
          autoComplete="name"
          {...register("name")}
        />
        {errors.name && (
          <span className="text-xs text-red-500">{errors.name.message}</span>
        )}
      </div>
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Complete setup"}
      </Button>
    </form>
  );
};

export default CompleteRegistrationForm;
