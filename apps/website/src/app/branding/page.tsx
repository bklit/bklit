import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Bklit Branding",
  description: "Download the Bklit branding assets",
};

export default function BrandingPage() {
  return (
    <>
      <PageHeader />
      <div className="container mx-auto max-w-6xl px-4">
        <h1 className="text-2xl font-bold">Bklit Branding</h1>
      </div>
      <Footer />
    </>
  );
}
