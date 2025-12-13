import { defineConfig, defineDocs } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: "content/docs",
  code: {
    themes: {
      light: "vitesse-light",
      dark: "vitesse-black",
    },
  },
});

export default defineConfig();
