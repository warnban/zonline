import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.fzr.cards", pathname: "/**" },
    ],
  },
};

export default nextConfig;
