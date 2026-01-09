import { updates } from "fumadocs-mdx:collections/server";
import { loader } from "fumadocs-core/source";

export const updatesSource = loader({
  baseUrl: "/updates",
  source: updates.toFumadocsSource(),
});
