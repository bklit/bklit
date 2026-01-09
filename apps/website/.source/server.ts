// @ts-nocheck
import * as __fd_glob_2 from "../content/updates/2026-01-09-introducing-updates.mdx?collection=updates"
import * as __fd_glob_1 from "../content/updates/2026-01-08-performance-improvements.mdx?collection=updates"
import * as __fd_glob_0 from "../content/updates/2026-01-07-new-dashboard-features.mdx?collection=updates"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const updates = await create.docs("updates", "content/updates", {}, {"2026-01-07-new-dashboard-features.mdx": __fd_glob_0, "2026-01-08-performance-improvements.mdx": __fd_glob_1, "2026-01-09-introducing-updates.mdx": __fd_glob_2, });