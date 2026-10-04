import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace packages export raw .ts, so Next has to compile them.
  transpilePackages: ["@recall/core"],
  // `next dev` rejects requests from hostnames it doesn't know; these let a phone use it through a tunnel.
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok-free.dev"],
  // Proxies /backend/* to the Mastra server, so a phone opening the site through a tunnel
  // only needs this one public URL. Set NEXT_PUBLIC_API_URL=/backend to use it.
  async rewrites() {
    const origin = process.env.API_ORIGIN ?? "http://localhost:4111";
    return [{ source: "/backend/:path*", destination: `${origin}/:path*` }];
  },
};

export default config;
