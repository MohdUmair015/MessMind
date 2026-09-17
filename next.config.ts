import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ensure easy deployment on AWS Amplify / standard node runtime
};

export default nextConfig;
