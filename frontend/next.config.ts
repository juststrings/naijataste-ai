import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/simulate-review",
        destination: `${apiUrl}/simulate-review`,
      },
      {
        source: "/api/recommend",
        destination: `${apiUrl}/recommend`,
      },
    ];
  },
};

export default nextConfig;
