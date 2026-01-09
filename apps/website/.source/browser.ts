// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  updates: create.doc("updates", {"2026-01-07-new-dashboard-features.mdx": () => import("../content/updates/2026-01-07-new-dashboard-features.mdx?collection=updates"), "2026-01-08-performance-improvements.mdx": () => import("../content/updates/2026-01-08-performance-improvements.mdx?collection=updates"), "2026-01-09-introducing-updates.mdx": () => import("../content/updates/2026-01-09-introducing-updates.mdx?collection=updates"), }),
};
export default browserCollections;