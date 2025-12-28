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
}: SectionBasicProps) => {
  return (
    <section>
      <div className="container mx-auto max-w-6xl flex flex-col px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-1 row-start-1 col-start-1 p-14 space-y-4">
            <h2 className="text-3xl font-regular dark:text-white text-black">
              {title}
            </h2>
            {children}
          </div>
          <div className="flex items-center justify-center col-span-1 col-start-2 row-start-1">
            {artwork && artwork}
          </div>
        </div>
      </div>
    </section>
  );
};
