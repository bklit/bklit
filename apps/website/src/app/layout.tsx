import { Toaster } from "@bklit/ui/components/sonner";
import "@bklit/ui/globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";
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
    <html className="dark" lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          <PageHeader />
          {children}
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
