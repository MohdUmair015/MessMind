import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return NextResponse.json({
      status: "static-demo",
      system: "MessMind Demand Intelligence (Static Demo Export)",
      version: "0.1.0-static",
      deployment: "github-pages",
      runtime: "static-files-only",
      database: "none (browser-safe synthetic snapshot)",
      ai: "deterministic-fallback (no active AWS Bedrock connection)",
      notice:
        "This is a pre-rendered static demonstration artifact. GitHub Pages serves static files only and does not execute server APIs or live system health probes.",
    });
  }

  const { getServerUser } = await import("@/modules/auth/server-auth");
  const user = await getServerUser();

  return NextResponse.json({
    status: "ok",
    system: "MessMind Demand Intelligence",
    version: "0.1.0-foundation",
    environment: "fullstack-node",
    timestamp: new Date().toISOString(),
    currentUser: {
      id: user.id,
      role: user.role,
      permissionsCount: user.permissions.length,
    },
  });
}
