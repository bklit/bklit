import * as z from "zod";

export const addProjectSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Project name must be at least 3 characters long." })
    .max(100, { message: "Project name must be 100 characters or less." }),
  domain: z
    .string({ required_error: "Domain is required" })
    .min(1, { message: "Domain is required" })
    .url({ message: "Please enter a valid URL (e.g., https://example.com)" }),
  organizationId: z.string().min(1, { message: "Organization is required" }),
});

export type AddProjectFormValues = z.infer<typeof addProjectSchema>;
