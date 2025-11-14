import { Brands } from "@/components/brands";
import { FAQ } from "@/components/faq";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { PageHeader } from "@/components/page-header";
import { Testimonials } from "@/components/testimonials";

export default function MarketingHomePage() {
  return (
    <>
      <div className=" bg-linear-to-b from-background to-background/50 to-[500px]">
        <PageHeader />
        <Hero />

        <Brands />
      </div>

      <Features />
      <Testimonials />
      <FAQ />

      <Footer />
    </>
  );
}
