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
      <div className="container mx-auto flex max-w-6xl flex-col px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="col-span-1 col-start-1 row-start-1 space-y-4 p-14">
            <h2 className="font-regular text-3xl text-black dark:text-white">
              {title}
            </h2>
            {children}
          </div>
          <div className="col-span-1 col-start-2 row-start-1 flex items-center justify-center">
            {artwork && artwork}
          </div>
        </div>
      </div>
    </section>
  );
};
