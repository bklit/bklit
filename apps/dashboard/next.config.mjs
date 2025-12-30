import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: [
    "@bklit/auth",
    "@bklit/db",
    "@bklit/ui",
    "@bklit/utils",
    "@bklit/analytics",
    "@bklit/api",
  ],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "icons.duckduckgo.com",
        pathname: "/ip3/**",
      },
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/extensions/:extensionId/:path*",
        destination: "/api/extensions/:extensionId/:path*",
      },
    ];
  },
};

export default config;
