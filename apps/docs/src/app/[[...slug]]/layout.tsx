import { BklitLogo } from "@bklit/ui/icons/bklit";
import { GithubInfo } from "fumadocs-ui/components/github-info";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        mode: "top",
        title: (
          <div className="flex items-center gap-2">
            <BklitLogo size={32} className="dark:text-white text-black" />
            <span className="text-lg font-semibold">Bklit Docs</span>
          </div>
        ),
      }}
      sidebar={{
        tabs: [
          {
            title: "Getting Started",
            description: "Get up and running with Bklit Analytics",
            url: "/getting-started",
            urls: new Set(["/", "/getting-started"]),
          },
          {
            title: "Dashboard",
            description: "Bklit Analytics Dashboard documentation",
            url: "/dashboard",
          },
          {
            title: "SDK",
            description: "Bklit Analytics SDK documentation",
            url: "/sdk",
          },
          {
            title: "Playground",
            description: "Test and demo the Bklit SDK",
            url: "/playground",
          },
          {
            title: "Reference",
            description: "Technical reference documentation",
            url: "/reference",
          },
        ],
      }}
      links={[
        {
          type: "custom",
          children: (
            <>
              <GithubInfo owner="bklit" repo="bklit" className="lg:-mx-2" />
              <h1>Hello</h1>
            </>
          ),
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
