interface Feature {
  title: string;
  subtitle: string;
  description: string;
}

const features: Feature[] = [
  {
    title: "Real-time data",
    subtitle: "See when and where users are",
    description:
      "Real-time analytics let you know what's happening in real-time.",
  },
  {
    title: "Custom events",
    subtitle: "Conversion tracking",
    description:
      "Custom events let you track specific user actions and interactions.",
  },
  {
    title: "Campaign tracking",
    subtitle: "UTM parameters",
    description:
      "Campaign tracking lets you track specific campaigns and channels with UTM parameters.",
  },
  {
    title: "Session analysis",
    subtitle: "Entry & exit pages",
    description:
      "Session analysis lets you see the user journey and how they interact with your website.",
  },
  {
    title: "Acquisitions",
    subtitle: "Acquisitions",
    description:
      "Session analysis lets you see the user journey and how they interact with your website.",
  },
  {
    title: "Global",
    subtitle: "Geographical data",
    description:
      "Geographic data lets you see where your users are coming from and where they are going.",
  },
];

export const Features = () => {
  return (
    <>
      <div className="bg-linear-to-b from-transparent to-background pt-20" />
      <div className="w-full border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800 px-px border-t border-b border-zinc-200 dark:border-zinc-800">
            {features.map((feature, index) => (
              <div
                key={index}
                className="col-span-1 bg-background grid grid-cols-1 grid-rows-1 p-8 relative"
              >
                <div className="col-span-1 col-start-1 row-start-1 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-medium dark:bg-clip-text dark:text-transparent dark:bg-linear-to-b from-amber-100 to-emerald-100">
                      {feature.title}
                    </h3>
                    <h4 className="text-md font-mono">{feature.subtitle}</h4>
                  </div>
                  <p className="text-sm font-mono text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
