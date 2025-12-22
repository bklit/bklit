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
      <div className="flex min-h-svh flex-1 items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-8">
        <div className="flex w-full max-w-md flex-col gap-8 py-4 sm:py-0">
          <div className="flex items-center justify-center gap-2">
            <BklitLogo className="text-black dark:text-white" size={64} />
            <span className="sr-only font-bold text-4xl">Bklit</span>
          </div>
          {children}
        </div>
      </div>

      <Toaster closeButton />
    </NuqsAdapter>
  );
}
