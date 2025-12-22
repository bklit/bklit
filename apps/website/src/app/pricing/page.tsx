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
    <main className="flex min-h-screen w-full flex-col gap-32">
      <PageHeader />
      <div className="container mx-auto flex max-w-6xl flex-col space-y-12 px-4 py-32">
        <SectionHeader
          description="Simple, transparent pricing for teams of all sizes."
          title="Pricing"
        >
          <p className="text-muted-foreground text-sm">
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
