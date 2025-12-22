import { Toaster } from "@bklit/ui/components/sonner";
import { BklitLogo } from "@bklit/ui/icons/bklit";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NuqsAdapter>
      <div className="flex flex-1 items-start sm:items-center justify-center p-4 sm:p-8 min-h-svh overflow-y-auto">
        <div className="flex flex-col gap-8 w-full max-w-md py-4 sm:py-0">
          <div className="flex items-center justify-center gap-2">
            <BklitLogo size={64} className="dark:text-white text-black" />
            <span className="text-4xl font-bold sr-only">Bklit</span>
          </div>
          {children}
        </div>
      </div>

      <Toaster closeButton />
    </NuqsAdapter>
  );
}
