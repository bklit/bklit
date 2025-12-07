import { BetterAuth as BetterAuthLogo } from "@bklit/ui/logos/better-auth";
import { Next as NextLogo } from "@bklit/ui/logos/nextjs";
import { Polar as PolarLogo } from "@bklit/ui/logos/polar";
import { Prisma as PrismaLogo } from "@bklit/ui/logos/prisma";
import { Resend as ResendLogo } from "@bklit/ui/logos/resend";
import { Tailwind as TailwindLogo } from "@bklit/ui/logos/tailwind";
import { TriggerDev as TriggerDevLogo } from "@bklit/ui/logos/triggerdev";
import { Turborepo as TurborepoLogo } from "@bklit/ui/logos/turborepo";
import { Vercel as VercelLogo } from "@bklit/ui/logos/vercel";

export const BrandTiles = () => {
  return (
    <div className="perspective-normal">
      <div className="grid grid-cols-3 -translate-y-5 rotate-x-40 rotate-y-0 text-black/50 gap-0 scale-90">
        <div className="col-span-1 flex items-center justify-center p-3 sm:p-8">
          <NextLogo height="50px" />
        </div>
        <div className="col-span-1 flex items-center justify-center p-3 sm:p-8">
          <ResendLogo height="50px" />
        </div>
        <div className="col-span-1 flex items-center justify-center p-3 sm:p-8">
          <PolarLogo height="50px" />
        </div>
        <div className="col-span-1 flex items-center justify-center p-3 sm:p-8">
          <VercelLogo height="50px" />
        </div>
        <div className="col-span-1 flex items-center justify-center p-3 sm:p-8">
          <PrismaLogo height="50px" />
        </div>
        <div className="col-span-1 flex items-center justify-center p-3 sm:p-8">
          <TailwindLogo height="50px" />
        </div>
        <div className="col-span-1 flex items-center justify-center p-3 sm:p-8">
          <TriggerDevLogo variant="mono" height="50px" />
        </div>
        <div className="col-span-1 flex items-center justify-center p-3 sm:p-8">
          <BetterAuthLogo height="50px" />
        </div>
        <div className="col-span-1 flex items-center justify-center p-3 sm:p-8">
          <TurborepoLogo variant="mono" height="50px" />
        </div>
      </div>
    </div>
  );
};
