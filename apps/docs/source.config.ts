import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  schema: {
    frontmatter: z.object({
      title: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
    }),
  },
});

export default defineConfig({
  generateManifest: true,
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "vitesse-light",
        dark: "vitesse-black",
      },
    },
  },
});
