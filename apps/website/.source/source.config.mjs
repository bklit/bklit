// source.config.ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
var updates = defineDocs({
  dir: "content/updates"
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
