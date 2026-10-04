import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace packages export raw .ts, so Next has to compile them.
  transpilePackages: ["@recall/core"],
};

export default config;
