import { Toaster } from "@bklit/ui/components/sonner";
import "@bklit/ui/globals.css";
import "../styles/globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Bklit Analytics",
  description: "Track your website analytics",
};

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <div className="grid grid-cols-1 grid-rows-1 h-full">
          <div className="col-span-1 col-start-1 row-start-1">
            <div className="container max-w-6xl mx-auto px-4 h-full">
              <div className="grid grid-cols-5 w-full min-h-screen h-full">
                <div className="col-span-1 border-l border-dashed border-zinc-800 h-full" />
                <div className="col-span-1 border-l border-dashed border-zinc-800 h-full" />
                <div className="col-span-1 border-l border-dashed border-zinc-800 h-full" />
                <div className="col-span-1 border-l border-dashed border-zinc-800 h-full" />
                <div className="col-span-1 border-l border-r border-dashed border-zinc-800 h-full" />
              </div>
            </div>
          </div>

          <div className="flex flex-col col-span-1 col-start-1 row-start-1">
            <Providers>
              {children}
              <Toaster />
            </Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
