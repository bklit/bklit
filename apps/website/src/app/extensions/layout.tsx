import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function ExtensionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}

