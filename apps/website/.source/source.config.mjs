// source.config.ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";
var updates = defineDocs({
  dir: "content/updates",
  schema: {
    frontmatter: z.object({
      title: z.string(),
      date: z.string(),
      author: z.string(),
      image: z.string().optional(),
      tags: z.array(z.string()).default(["update"])
    })
  }
});
var source_config_default = defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "vitesse-light",
        dark: "vitesse-black"
      }
    }
  }
});
export {
  source_config_default as default,
  updates
};
