export const Brands = () => {
  return (
    <div className="w-full border-t border-b border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-zinc-200 dark:bg-zinc-800 px-px">
          <div className="col-span-1 bg-background flex items-center justify-center p-8">
            <img src="/nextjs.svg" alt="Next.js" className="h-5 w-auto" />
          </div>
          <div className="col-span-1 bg-background flex items-center justify-center p-8">
            <img src="/resend.svg" alt="Resend" className="h-5 w-auto" />
          </div>
          <div className="col-span-1 bg-background flex items-center justify-center p-8">
            <img src="/turborepo.svg" alt="Turborepo" />
          </div>
          <div className="col-span-1 bg-background flex items-center justify-center p-8">
            <img src="/polar.svg" alt="Polar.sh" className="h-6 w-auto" />
          </div>
          <div className="col-span-1 bg-background flex items-center justify-center p-8">
            <img src="/prisma.svg" alt="Prisma" className="h-6 w-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
