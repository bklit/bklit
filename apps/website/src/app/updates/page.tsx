import type { Metadata } from "next";
import { UpdatesPageContent } from "@/components/updates-page-content";
import { getAllUpdates } from "@/lib/updates";

export const metadata: Metadata = {
  title: "Updates & Changelog - Bklit Analytics",
  description:
    "Stay up to date with the latest features, improvements, and updates to Bklit Analytics.",
};

const UPDATES_PER_PAGE = 30;

export default function UpdatesPage() {
  const allUpdates = getAllUpdates();
  const updates = allUpdates.slice(0, UPDATES_PER_PAGE);
  const hasMore = allUpdates.length > UPDATES_PER_PAGE;

  return <UpdatesPageContent hasMore={hasMore} updates={updates} />;
}
