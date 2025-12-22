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
      <div className="container mx-auto flex max-w-6xl flex-col px-4">
        <div className="grid grid-cols-1 gap-8 rounded-4xl bg-bklit-100 md:grid-cols-2 dark:bg-zinc-900">
          <div className="col-span-1 space-y-4 p-14">
            <h2 className="font-regular text-3xl text-black dark:text-white">
              {title}
            </h2>
            {children}
          </div>
          <div
            className={cn(
              "col-span-1 flex items-center justify-center overflow-hidden rounded-4xl rounded-t-none bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 sm:rounded-r-4xl sm:rounded-l-none",
              variant === "mono" && "from-zinc-800 to-zinc-900"
            )}
          >
            {artwork && artwork}
          </div>
        </div>
      </div>
    </section>
  );
};
