import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["@bklit/auth", "@bklit/db", "@bklit/ui", "@bklit/utils"],
  typescript: { ignoreBuildErrors: true },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
        pathname: "/ip3/**",
      },
    ],
  },
};

export default config;
