import { authEnv, polarClient } from "@bklit/auth";

const env = authEnv();

export interface ProProduct {
  productId: string;
  priceId: string;
  name: string;
  baseEvents: number;
  basePrice: number; // in cents
  overagePrice: number; // in dollars
}

export async function getProProduct(): Promise<ProProduct | null> {
  try {
    const response = await polarClient.products.list({
      organizationId: env.POLAR_ORGANIZATION_ID,
    });

    const activeProduct = response.result.items.find((p) => !p.isArchived);

    if (!activeProduct) {
      return null;
    }

    const baseEvents = activeProduct.metadata?.base_events;
    if (!baseEvents) {
      return null;
    }

    const eventLimit =
      typeof baseEvents === "number"
        ? baseEvents
        : Number.parseInt(baseEvents as string, 10);

    if (Number.isNaN(eventLimit)) {
      return null;
    }

    let fixedPrice: number | null = null;
    let overagePrice: number | null = null;
    let priceId: string | null = null;

    if (activeProduct.prices && activeProduct.prices.length > 0) {
      for (const price of activeProduct.prices) {
        if (!price.recurringInterval) {
          continue;
        }

        if (price.amountType === "fixed" && price.priceAmount) {
          fixedPrice = price.priceAmount;
          priceId = price.id;
        }

        if (price.amountType === "metered_unit" && price.unitAmount) {
          const unitAmountCents = Number.parseFloat(price.unitAmount);
          overagePrice = unitAmountCents / 100;
        }
      }
    }

    if (fixedPrice === null || priceId === null) {
      return null;
    }

    return {
      productId: activeProduct.id,
      priceId,
      name: activeProduct.name,
      baseEvents: eventLimit,
      basePrice: fixedPrice,
      overagePrice: overagePrice || 0,
    };
  } catch (error) {
    console.error("Failed to fetch Pro product:", error);
    return null;
  }
}
