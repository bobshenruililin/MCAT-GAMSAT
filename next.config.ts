import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  agentRules: false,
  // Next 16 blocks 127.0.0.1 from localhost in dev; local-first study uses both.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
