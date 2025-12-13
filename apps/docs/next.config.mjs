import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

const withMDX = createMDX({
  // configPath: "source.config.ts" // if you want to customize the path
});

export default withMDX(config);
