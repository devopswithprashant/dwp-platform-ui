import type { NextConfig } from "next";

const authHost = process.env.AUTH_SERVICE_HOST || "localhost";
const authPort = process.env.AUTH_SERVICE_PORT || "8081";
const profileHost = process.env.PROFILE_SERVICE_HOST || "localhost";
const profilePort = process.env.PROFILE_SERVICE_PORT || "8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/auth/:path*",
        destination: `http://${authHost}:${authPort}/api/v1/auth/:path*`,
      },
      {
        source: "/api/v1/profiles/:path*",
        destination: `http://${profileHost}:${profilePort}/api/v1/profiles/:path*`,
      },
    ];
  },
};

export default nextConfig;
