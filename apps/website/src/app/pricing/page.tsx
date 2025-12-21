import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";
import { Pricing } from "@/components/pricing";
import { SectionHeader } from "@/components/section-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Bklit Pricing",
  description: "Simple, transparent pricing for teams of all sizes.",
};

export default async function PricingPage() {
  return (
    <main className="w-full min-h-screen flex flex-col gap-32">
      <PageHeader />
      <div className="container mx-auto max-w-6xl flex flex-col px-4 py-32 space-y-12">
        <SectionHeader
          title="Pricing"
          description="Simple, transparent pricing for teams of all sizes."
        >
          <p className="text-sm text-muted-foreground">
            All prices exclude applicable taxes. Tax will be calculated at
            checkout based on your location.
          </p>
        </SectionHeader>
        <Pricing />
      </div>
      <Footer />
    </main>
  );
}
