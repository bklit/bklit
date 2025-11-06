import * as z from "zod";

export const inviteMemberSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
  organizationId: z.string().min(1, { message: "Organization is required" }),
  role: z.enum(["member", "admin", "owner"]).default("member"),
});

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;
