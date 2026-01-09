import { sendEmail } from "@bklit/email/client";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const emailRouter = createTRPCRouter({
  send: publicProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string(),
        html: z.string().optional(),
        text: z.string().optional(),
        from: z.string().email().optional(),
        react: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendEmail({
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        from: input.from,
        react: input.react,
      });

      console.log("Email sent", { to: input.to, subject: input.subject });
      return result;
    }),
});
