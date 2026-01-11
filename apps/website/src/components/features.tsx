interface Feature {
  title: string;
  subtitle: string;
  description: string;
}

const features: Feature[] = [
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
];

export const Features = () => {
  return (
    <div className="w-full">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {features.map((feature) => (
            <div
              className="relative flex flex-col gap-2 nth-[3n+3]:border-r-0 p-6 sm:border-r sm:nth-last-[-n+3]:border-b-0 sm:p-12 md:border-b"
              key={feature.title}
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-slate-300 text-xl">
                  {feature.title}
                </h3>
              </div>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
