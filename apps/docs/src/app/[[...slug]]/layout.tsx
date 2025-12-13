import { GithubInfo } from "fumadocs-ui/components/github-info";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { nav, ...base } = baseOptions();

  return (
    <DocsLayout
      {...base}
      nav={{ ...nav, mode: "top" }}
      tree={source.pageTree}
      sidebar={{
        tabs: [
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
        ],
      }}
      links={[
        {
          type: "custom",
          children: (
            <GithubInfo owner="bklit" repo="bklit" className="lg:-mx-2" />
          ),
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
