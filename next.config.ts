import type { NextConfig } from "next";

const authHost = process.env.AUTH_SERVICE_HOST || "localhost";
const authPort = process.env.AUTH_SERVICE_PORT || "8081";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/auth/:path*",
        destination: `http://${authHost}:${authPort}/api/v1/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
