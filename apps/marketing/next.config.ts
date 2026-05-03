import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: { unoptimized: true },
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
};

export default nextConfig;
