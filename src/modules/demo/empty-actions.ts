/**
 * Browser-Safe No-Op Stub for Static Export Mode
 *
 * In static demo mode (NEXT_PUBLIC_DEMO_MODE=true), Next.js statically exports
 * HTML without Server Action endpoints. This stub replaces server action imports
 * during static compilation, guaranteeing zero server actions in the static output.
 */

export async function syncMealAttendanceAction(_mealId: string) {
  return { success: false, error: "Server actions are disabled in static export mode." };
}

export async function simulateScannerSyncAction(_mealId: string, _scannedCount?: number) {
  return { success: false, error: "Server actions are disabled in static export mode." };
}

export async function resetMealDemoScansAction(_mealId: string) {
  return { success: false, error: "Server actions are disabled in static export mode." };
}

export async function recordOutcomeAction(_input: unknown) {
  return { success: false, error: "Server actions are disabled in static export mode." };
}

export async function regeneratePredictionAction(_mealId: string, _customBuffer?: number) {
  return { success: false, error: "Server actions are disabled in static export mode." };
}
