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
              <BklitLogo size={32} className="dark:text-white text-black" />
              <span className="text-2xl font-bold">Bklit</span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-lg">{children}</div>
          </div>
        </div>
        <div className="bg-background relative hidden lg:grid grid-cols-1 grid-rows-1 h-full overflow-hidden">
          <div className="col-start-1 row-start-1 w-full h-full">
            <Diamonds
              vignetteStrength={0.8}
              grainScale={0.5}
              tileCount={3}
              tileMinSize={60}
              mouseDampening={0.71}
              mirrorGradient={true}
              spotlightRadius={1}
              spotlightSoftness={1}
              spotlightOpacity={1}
              distortAmount={10}
              shineDirection={"left"}
              mixBlendMode={"normal"}
              gradientColors={["#000000", "#d2f98b"]}
            />
          </div>
          <div className="col-start-1 row-start-1 w-full h-full bg-linear-to-b from-transparent via-background/10 to-background z-10 pointer-events-none" />
        </div>
      </div>
      <Toaster closeButton />
    </NuqsAdapter>
  );
}
