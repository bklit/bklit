"use client";

import { Button } from "@bklit/ui/components/button";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { BetterAuth as BetterAuthLogo } from "@bklit/ui/logos/better-auth";
import { Biome as BiomeLogo } from "@bklit/ui/logos/biome";
import { Clickhouse as ClickhouseLogo } from "@bklit/ui/logos/clickhouse";
import { Next as NextLogo } from "@bklit/ui/logos/nextjs";
import { Polar as PolarLogo } from "@bklit/ui/logos/polar";
import { Prisma as PrismaLogo } from "@bklit/ui/logos/prisma";
import { Raycast as RaycastLogo } from "@bklit/ui/logos/raycast";
import { Resend as ResendLogo } from "@bklit/ui/logos/resend";
import { Tailwind as TailwindLogo } from "@bklit/ui/logos/tailwind";
import { TriggerDev as TriggerDevLogo } from "@bklit/ui/logos/triggerdev";
import { Turborepo as TurborepoLogo } from "@bklit/ui/logos/turborepo";
import { Vercel as VercelLogo } from "@bklit/ui/logos/vercel";
import { motion } from "motion/react";
import { useState } from "react";

const logos = [
  { id: "next", Component: NextLogo, height: "50px" },
  { id: "resend", Component: ResendLogo, height: "50px" },
  { id: "polar", Component: PolarLogo, height: "50px" },
  { id: "vercel", Component: VercelLogo, height: "50px" },
  { id: "prisma", Component: PrismaLogo, height: "50px" },
  { id: "raycast", Component: RaycastLogo, height: "50px" },
  { id: "tailwind", Component: TailwindLogo, height: "50px" },
  {
    id: "triggerdev",
    Component: TriggerDevLogo,
    height: "50px",
    variant: "mono" as const,
  },
  { id: "betterauth", Component: BetterAuthLogo, height: "50px" },
  {
    id: "turborepo",
    Component: TurborepoLogo,
    height: "50px",
    variant: "mono" as const,
  },
  { id: "clickhouse", Component: ClickhouseLogo, height: "50px" },
  { id: "biome", Component: BiomeLogo, height: "24px" },
];

export const BrandTiles = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="hidden flex-col items-center justify-center gap-4 sm:flex">
      <h2 className="text-muted-foreground text-sm">
        Built with the best development tools in the industry
      </h2>
      <motion.div
        className="relative grid grid-cols-6 gap-0 text-foreground"
        onHoverEnd={() => setIsHovered(false)}
        onHoverStart={() => setIsHovered(true)}
      >
        {logos.map((logo) => {
          const LogoComponent = logo.Component as React.ComponentType<{
            height: string;
            variant?: string;
          }>;
          return (
            <motion.div
              animate={{
                opacity: isHovered ? 0.6 : 1,
                filter: isHovered ? "blur(4px)" : "blur(0px)",
              }}
              className="col-span-1 flex items-center justify-center p-3 sm:p-8"
              key={logo.id}
              transition={{
                ease: "easeInOut",
                duration: 0.18,
              }}
            >
              <LogoComponent
                height={logo.height}
                {...("variant" in logo && { variant: logo.variant })}
              />
            </motion.div>
          );
        })}
        <motion.div
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.9,
            filter: isHovered ? "blur(0px)" : "blur(4px)",
            pointerEvents: isHovered ? "auto" : "none",
          }}
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2"
          initial={{ opacity: 0, scale: 0.9, filter: "blur(40px)" }}
          transition={{
            ease: "easeInOut",
            delay: 0.1,
          }}
        >
          <Button asChild variant="mono">
            <a
              href="https://github.com/bklit/bklit"
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitHubIcon className="size-4" />
              GitHub
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
