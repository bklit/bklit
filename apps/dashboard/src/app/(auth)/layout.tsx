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
      <div className="flex flex-1 items-center justify-center p-8 min-h-svh max-h-svh">
        <div className="flex flex-col gap-8 w-full max-w-md ">
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
