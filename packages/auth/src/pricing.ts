import pricingPlansData from "./pricing-plans.json";

export interface PricingPlan {
  name: string;
  description: string;
  price: number;
  interval: "month" | "year";
  slug: string;
  polarProductId: string;
  isPopular?: boolean;
  benefits: string[];
}

export function getPricingPlans(): PricingPlan[] {
  return pricingPlansData.map((plan) => {
    let polarProductId: string = "";
    if (plan.polarProductId) {
      polarProductId = plan.polarProductId;
    } else if (plan.slug === "BKLIT-PRO") {
      polarProductId = process.env.NEXT_PUBLIC_POLAR_PRO_PLAN_PRODUCT_ID || "";
    }

    return {
      ...plan,
      polarProductId: polarProductId || "",
    };
  });
}

export function getPricingPlanBySlug(slug: string): PricingPlan | undefined {
  return getPricingPlans().find((plan) => plan.slug === slug);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100); // Prices are stored in cents
}
