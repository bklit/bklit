import { PrismaClient } from "../packages/db/src/generated/prisma";

const prisma = new PrismaClient();

// Sample acquisition data
const acquisitionData = [
  {
    referrer: "https://www.google.com/search?q=example",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  },
  {
    referrer: "https://www.google.com/search?q=tracking",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  },
  {
    referrer: "https://www.bing.com/search?q=analytics",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  },
  {
    referrer: "https://www.facebook.com",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  },
  {
    referrer: "https://twitter.com",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  },
  {
    referrer: "https://www.linkedin.com",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  },
  {
    referrer: null,
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "summer-sale",
  },
  {
    referrer: null,
    utmSource: "facebook",
    utmMedium: "social",
    utmCampaign: "brand-awareness",
  },
  {
    referrer: null,
    utmSource: "newsletter",
    utmMedium: "email",
    utmCampaign: "weekly-update",
  },
  {
    referrer: "https://example.com",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  },
  {
    referrer: "https://blog.example.com",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  },
  {
    referrer: null,
    utmSource: "youtube",
    utmMedium: "video",
    utmCampaign: "tutorial-series",
  },
  {
    referrer: null,
    utmSource: "reddit",
    utmMedium: "social",
    utmCampaign: "community",
  },
  {
    referrer: "https://www.yahoo.com/search",
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
  },
  {
    referrer: null,
    utmSource: "instagram",
    utmMedium: "social",
    utmCampaign: "influencer",
  },
  { referrer: null, utmSource: null, utmMedium: null, utmCampaign: null }, // Direct traffic
  { referrer: null, utmSource: null, utmMedium: null, utmCampaign: null }, // Direct traffic
  { referrer: null, utmSource: null, utmMedium: null, utmCampaign: null }, // Direct traffic
];

async function seedAcquisitions() {
  try {
    console.log("🌱 Starting acquisition data seeding...");

    // Get all existing pageview events
    const pageviews = await prisma.pageViewEvent.findMany({
      select: { id: true },
      orderBy: { timestamp: "desc" },
    });

    console.log(`📊 Found ${pageviews.length} existing pageview events`);

    if (pageviews.length === 0) {
      console.log(
        "❌ No pageview events found. Please create some pageviews first.",
      );
      return;
    }

    // Update pageviews with acquisition data
    let updated = 0;
    for (
      let i = 0;
      i < Math.min(pageviews.length, acquisitionData.length);
      i++
    ) {
      const pageview = pageviews[i];
      const acquisition = acquisitionData[i % acquisitionData.length];

      await prisma.pageViewEvent.update({
        where: { id: pageview.id },
        data: {
          referrer: acquisition.referrer,
          utmSource: acquisition.utmSource,
          utmMedium: acquisition.utmMedium,
          utmCampaign: acquisition.utmCampaign,
          utmTerm: acquisition.utmSource === "google" ? "analytics" : null,
          utmContent: acquisition.utmCampaign
            ? `ad-${Math.floor(Math.random() * 1000)}`
            : null,
        },
      });

      updated++;
    }

    console.log(
      `✅ Successfully updated ${updated} pageview events with acquisition data`,
    );
    console.log("🎉 Acquisition seeding completed!");

    // Show summary
    const stats = await prisma.pageViewEvent.groupBy({
      by: ["referrer", "utmSource"],
      _count: true,
      where: {
        OR: [{ referrer: { not: null } }, { utmSource: { not: null } }],
      },
    });

    console.log("\n📈 Acquisition data summary:");
    stats.forEach((stat) => {
      const source = stat.utmSource || stat.referrer || "Direct";
      console.log(`  ${source}: ${stat._count} views`);
    });
  } catch (error) {
    console.error("❌ Error seeding acquisition data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAcquisitions();
