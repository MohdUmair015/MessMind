import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";
import path from "path";

export default function nextConfig(phase: string): NextConfig {
  const isStaticDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  if (isStaticDemo) {
    return {
      reactStrictMode: true,
      output: "export",
      basePath: "/MessMind",
      trailingSlash: true,
      images: {
        unoptimized: true,
      },
      // In local dev, provide convenient redirects so localhost:3000/ redirects to /MessMind/
      // In production build (static export), omit redirects to avoid export warnings and ensure zero reliance on server redirects
      ...(isDev
        ? {
            async redirects() {
              return [
                {
                  source: "/",
                  destination: "/MessMind",
                  basePath: false,
                  permanent: false,
                },
                {
                  source: "/meals",
                  destination: "/MessMind/meals",
                  basePath: false,
                  permanent: false,
                },
                {
                  source: "/meals/:path*",
                  destination: "/MessMind/meals/:path*",
                  basePath: false,
                  permanent: false,
                },
                {
                  source: "/predictions",
                  destination: "/MessMind/predictions",
                  basePath: false,
                  permanent: false,
                },
                {
                  source: "/analytics",
                  destination: "/MessMind/analytics",
                  basePath: false,
                  permanent: false,
                },
                {
                  source: "/admin",
                  destination: "/MessMind/admin",
                  basePath: false,
                  permanent: false,
                },
                {
                  source: "/administration",
                  destination: "/MessMind/admin",
                  basePath: false,
                  permanent: false,
                },
              ];
            },
          }
        : {}),
      webpack: (config) => {
        const emptyActionsPath = path.resolve(process.cwd(), "src/modules/demo/empty-actions.ts");
        const mealActionsPath = path.resolve(process.cwd(), "src/app/actions/meal-actions");
        const explanationActionsPath = path.resolve(process.cwd(), "src/app/actions/explanation-actions");

        config.resolve.alias = {
          ...config.resolve.alias,
          "@/app/actions/meal-actions": emptyActionsPath,
          "@/app/actions/explanation-actions": emptyActionsPath,
          [mealActionsPath]: emptyActionsPath,
          [`${mealActionsPath}.ts`]: emptyActionsPath,
          [explanationActionsPath]: emptyActionsPath,
          [`${explanationActionsPath}.ts`]: emptyActionsPath,
        };
        return config;
      },
    };
  }

  // Full-stack mode (NEXT_PUBLIC_DEMO_MODE=false or unset)
  return {
    reactStrictMode: true,
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
}
