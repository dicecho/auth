"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GalleryVerticalEnd } from "lucide-react";
import ResetPasswordRequestForm from "@/components/auth/reset-password-request-form";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { useSearchParams } from "next/navigation";

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || undefined;
  const error = searchParams.get("error") || undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <div className="flex flex-col items-center w-full max-w-md gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Zexa Better Auth
        </a>
        <Card className="w-full">
          <CardContent className="flex flex-col gap-4 pt-6">
            {token ? (
              <>
                {error && (
                  <div className="text-sm text-destructive">
                    Token invalid or expired. Please request a new link.
                  </div>
                )}
                <ResetPasswordForm token={token} />
              </>
            ) : (
              <ResetPasswordRequestForm />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
