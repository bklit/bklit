import { Diamonds } from "@bklit/ui/components/diamonds/diamonds";
import { Toaster } from "@bklit/ui/components/sonner";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NuqsAdapter>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <div className="flex items-center gap-2">
              <BklitLogo className="text-black dark:text-white" size={32} />
              <span className="font-bold text-2xl">Bklit</span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-lg">{children}</div>
          </div>
        </div>
        <div className="relative hidden h-full grid-cols-1 grid-rows-1 overflow-hidden bg-background lg:grid">
          <div className="col-start-1 row-start-1 h-full w-full">
            <Diamonds
              distortAmount={10}
              gradientColors={["#000000", "#d2f98b"]}
              grainScale={0.5}
              mirrorGradient={true}
              mixBlendMode={"normal"}
              mouseDampening={0.71}
              shineDirection={"left"}
              spotlightOpacity={1}
              spotlightRadius={1}
              spotlightSoftness={1}
              tileCount={3}
              tileMinSize={60}
              vignetteStrength={0.8}
            />
          </div>
          <div className="pointer-events-none z-10 col-start-1 row-start-1 h-full w-full bg-linear-to-b from-transparent via-background/10 to-background" />
        </div>
      </div>
      <Toaster closeButton />
    </NuqsAdapter>
  );
}
