import { Badge } from "@bklit/ui/components/badge";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";
import { Pricing } from "@/components/pricing";
import { SectionHeader } from "@/components/section-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StatusPage() {
  return (
    <main className="w-full min-h-screen flex flex-col gap-32">
      <PageHeader />
      <div className="container mx-auto max-w-6xl flex flex-col px-4 py-26 space-y-12">
        <SectionHeader
          title="Pricing"
          description="Simple, transparent pricing for teams of all sizes."
        >
          <div className="flex items-center w-full justify-center">
            <Badge variant="success" size="lg">
              🫶 Bklit is currently in beta and free
            </Badge>
          </div>
        </SectionHeader>
        <Pricing />
      </div>
      <Footer />
    </main>
  );
}
