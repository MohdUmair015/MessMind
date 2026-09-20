import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ensure easy deployment on AWS Amplify / standard node runtime
  async redirects() {
    return [
      {
        source: "/administration",
        destination: "/admin",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
