import { cn } from "@bklit/ui/lib/utils";

interface SectionBasicProps {
  title: string;
  children: React.ReactNode;
  artwork?: React.ReactNode;
  variant?: "default" | "mono";
}

export const SectionBasic = ({
  title,
  children,
  artwork,
  variant = "default",
}: SectionBasicProps) => {
  return (
    <section>
      <div className="container mx-auto max-w-6xl flex flex-col px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-bklit-100 dark:bg-zinc-900 rounded-4xl">
          <div className="col-span-1 p-14 space-y-4">
            <h2 className="text-3xl font-regular dark:text-white text-black">
              {title}
            </h2>
            {children}
          </div>
          <div
            className={cn(
              "flex items-center justify-center col-span-1 bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 rounded-4xl rounded-t-none sm:rounded-l-none sm:rounded-r-4xl overflow-hidden",
              variant === "mono" && "from-zinc-800 to-zinc-900",
            )}
          >
            {artwork && artwork}
          </div>
        </div>
      </div>
    </section>
  );
};
