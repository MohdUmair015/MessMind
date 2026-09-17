import { NextResponse } from "next/server";
import { getServerUser } from "@/modules/auth/server-auth";

export async function GET() {
  const user = await getServerUser();

  return NextResponse.json({
    status: "ok",
    system: "MessMind Demand Intelligence",
    version: "0.1.0-foundation",
    environment: "demo-synthetic",
    timestamp: new Date().toISOString(),
    currentUser: {
      id: user.id,
      role: user.role,
      permissionsCount: user.permissions.length,
    },
  });
}
