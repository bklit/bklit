interface Feature {
  title: string;
  subtitle: string;
  description: string;
}

const features: Feature[] = [
  {
    title: "Real-time",
    subtitle: "See when and where users are",
    description:
      "Real-time analytics let you know where your visitors are in in the world and what they are interested in.",
  },
  {
    title: "Custom events",
    subtitle: "Conversion tracking",
    description:
      "Custom events let you track specific user actions and interactions.",
  },
  {
    title: "Campaigns",
    subtitle: "UTM parameters",
    description:
      "Campaign tracking lets you track specific campaigns and channels with UTM parameters.",
  },
  {
    title: "Funnels",
    subtitle: "Conversion tracking",
    description:
      "Funnels let you track specific user journeys and conversions through funnels you create.",
  },
  {
    title: "Sessions",
    subtitle: "Entry & exit pages",
    description:
      "Session analysis lets you see the user journey and how they interact with your website.",
  },
  {
    title: "Acquisitions",
    subtitle: "Where users are coming from",
    description:
      "Session analysis lets you see the user journey and how they interact with your website.",
  },
  {
    title: "Devices & browsers",
    subtitle: "What your users experience",
    description:
      "Devices and browsers allows you to see what devices and browsers your users are using to access your website.",
  },
  {
    title: "Cookie-less tracking",
    subtitle: "No feeding the monster",
    description:
      "By default Bklit doesn't store any indetifiable data about your users, so no cookies and completely GDPR compliant.",
  },
  {
    title: "Simple SDKs",
    subtitle: "Use with any framework",
    description:
      "Bklit provides simple SDKs for your website, so you can start tracking your users in minutes.",
  },
];

export const Features = () => {
  return (
    <div className="w-full">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 relative border-b sm:border-r p-6 sm:p-12 nth-[3n+3]:border-r-0 sm:nth-last-[-n+3]:border-b-0"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
