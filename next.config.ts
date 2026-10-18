import type { NextConfig } from "next";

const authHost = process.env.AUTH_SERVICE_HOST || "localhost";
const authPort = process.env.AUTH_SERVICE_PORT || "8081";
const userHost = process.env.USER_SERVICE_HOST || "localhost";
const userPort = process.env.USER_SERVICE_PORT || "8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/auth/:path*",
        destination: `http://${authHost}:${authPort}/api/v1/auth/:path*`,
      },
      {
        source: "/api/v1/users/:path*",
        destination: `http://${userHost}:${userPort}/api/v1/users/:path*`,
      },
    ];
  },
};

export default nextConfig;
