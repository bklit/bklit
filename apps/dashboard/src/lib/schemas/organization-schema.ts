import * as z from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Organization name must be at least 2 characters long.",
    })
    .max(50, { message: "Organization name must be 50 characters or less." }),
  description: z
    .string()
    .max(200, { message: "Description must be 200 characters or less." }),
});

export type CreateOrganizationFormValues = z.infer<
  typeof createOrganizationSchema
>;

