import { z } from "zod";

export type ActionResult<T = unknown> = {
  success: { reason: string } | null;
  error: { reason: string } | null;
  data?: T;
};

export const emailRegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export type EmailRegisterSchema = z.infer<typeof emailRegisterSchema>;

export const completeRegistrationSchema = z
  .object({
    name: z.string().min(2).max(100),
  })

export type CompleteRegistrationSchema = z.infer<
  typeof completeRegistrationSchema
>;
