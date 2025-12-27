export type Role =
  | 'superadmin'
  | 'admin'
  | 'operator'
  | 'viewer';

export const ROLE_HIERARCHY: Record<Role, number> = {
  superadmin: 100,
  admin: 80,
  operator: 50,
  viewer: 10
};

export function hasPermission(
  userRole: Role,
  requiredRole: Role
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
