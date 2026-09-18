import { headers } from "next/headers";
import { AuthUser, UserRole, ROLE_PERMISSIONS, Permission } from "./types";

/**
 * Server-Side Authentication & Authorization Module
 * 
 * SECURITY ARCHITECTURE NOTE:
 * The frontend role selector is strictly a development/demo UI convenience.
 * All protected server actions and API route handlers MUST call `requireServerRole()`
 * or `getServerUser()` to enforce security server-side.
 * 
 * In production on AWS Amplify / AWS RDS, replace this demo adapter
 * with AWS Cognito JWT validation or NextAuth session resolution.
 */

export class AuthorizationError extends Error {
  statusCode: number;
  constructor(message = "Unauthorized: Insufficient permissions", statusCode = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = statusCode;
  }
}

export async function getServerUser(mockRole?: UserRole): Promise<AuthUser> {
  let activeRole: UserRole = "MESS_MANAGER";

  if (mockRole) {
    activeRole = mockRole;
  } else {
    try {
      const reqHeaders = await headers();
      const demoRoleHeader = reqHeaders.get("x-messmind-demo-role") as UserRole | null;
      if (demoRoleHeader === "HOSTEL_ADMIN" || demoRoleHeader === "MESS_MANAGER") {
        activeRole = demoRoleHeader;
      }
    } catch {
      // Running outside Next.js request context (e.g. in test suite or background worker)
      activeRole = "MESS_MANAGER";
    }
  }

  return {
    id: activeRole === "HOSTEL_ADMIN" ? "admin-synthetic-01" : "manager-synthetic-01",
    name: activeRole === "HOSTEL_ADMIN" ? "Demo Hostel Admin" : "Demo Mess Manager",
    email: activeRole === "HOSTEL_ADMIN" ? "admin@hostel-demo.local" : "manager@hostel-demo.local",
    role: activeRole,
    permissions: ROLE_PERMISSIONS[activeRole],
  };
}

export async function requireServerRole(
  allowedRoles: UserRole[],
  mockRole?: UserRole
): Promise<AuthUser> {
  const user = await getServerUser(mockRole);

  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      `Access denied: Action requires one of [${allowedRoles.join(", ")}], but current role is ${user.role}`
    );
  }

  return user;
}

export async function requirePermission(
  permission: Permission,
  mockRole?: UserRole
): Promise<AuthUser> {
  const user = await getServerUser(mockRole);

  if (!user.permissions.includes(permission)) {
    throw new AuthorizationError(`Access denied: Missing required permission '${permission}'`);
  }

  return user;
}
