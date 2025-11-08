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
          <div className="col-start-1 row-start-1 w-full h-full isolate ">
            <div className="absolute inset-0 bg-linear-to-br from-brand-500/20 to-background mix-blend-multiply" />
            <BklitLogo className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 size-dvw mix-blend-multiply text-brand-300/10" />
            <BklitLogo className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 size-dvw mix-blend-color-burn text-fuchsia-300/20" />
            {/* <BklitLogo className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-96 text-white" /> */}
          </div>
        </div>
      </div>
      <Toaster closeButton />
    </NuqsAdapter>
  );
}
