import { defineConfig, defineDocs } from "fumadocs-mdx/config";

export const updates = defineDocs({
  dir: "content/updates",
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "vitesse-light",
        dark: "vitesse-black",
      },
    },
  },
});
