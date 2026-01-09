import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface UpdateFrontmatter {
  title: string;
  date: string;
  author: string;
  image?: string;
  tags?: string[];
}

export interface Update {
  slug: string;
  frontmatter: UpdateFrontmatter;
  content: string;
}

export type { Update as default };

const updatesDirectory = path.join(process.cwd(), "content/updates");

export function getAllUpdates(): Update[] {
  const fileNames = fs.readdirSync(updatesDirectory);
  const updates = fileNames
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(updatesDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        frontmatter: data as UpdateFrontmatter,
        content,
      };
    });

  // Sort by date (newest first)
  return updates.sort((a, b) => {
    return (
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
    );
  });
}

export function getUpdateBySlug(slug: string): Update | null {
  try {
    const fullPath = path.join(updatesDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      frontmatter: data as UpdateFrontmatter,
      content,
    };
  } catch {
    return null;
  }
}
