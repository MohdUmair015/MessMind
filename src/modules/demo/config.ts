/**
 * Static Demo Mode Configuration
 *
 * ARCHITECTURAL SPECIFICATION:
 * - Explicitly selectable through build-time environment setting `NEXT_PUBLIC_DEMO_MODE`.
 * - Never inferred from browser state, client sniffing, or runtime heuristics.
 * - Does not expose server secrets or private environment variables.
 * - In static demo deployments (e.g. GitHub Pages), NEXT_PUBLIC_DEMO_MODE=true activates
 *   the standalone client simulation layer.
 */
export function isStaticDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
