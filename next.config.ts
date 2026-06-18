import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  async redirects() {
    return [
      {
        source: "/presentation",
        destination: "/presentation/",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
