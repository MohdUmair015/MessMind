export type UserRole = 'MESS_MANAGER' | 'HOSTEL_ADMIN';

export type Permission =
  | 'view:dashboard'
  | 'view:predictions'
  | 'view:meals'
  | 'record:outcomes'
  | 'view:analytics'
  | 'manage:residents'
  | 'manage:menus'
  | 'manage:meals'
  | 'manage:prediction_settings'
  | 'view:audit_logs';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
}

export interface AuthSession {
  user: AuthUser;
  expiresAt: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  MESS_MANAGER: [
    'view:dashboard',
    'view:predictions',
    'view:meals',
    'record:outcomes',
    'view:analytics',
  ],
  HOSTEL_ADMIN: [
    'view:dashboard',
    'view:predictions',
    'view:meals',
    'record:outcomes',
    'view:analytics',
    'manage:residents',
    'manage:menus',
    'manage:meals',
    'manage:prediction_settings',
    'view:audit_logs',
  ],
};
