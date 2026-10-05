import { SubsystemRole } from './core-hub-identity';

export enum Permission {
  SOFTWARE_LICENSE_READ = 'software_license:read',
  SOFTWARE_LICENSE_CREATE = 'software_license:create',
  SOFTWARE_LICENSE_UPDATE = 'software_license:update',
  SOFTWARE_LICENSE_DELETE = 'software_license:delete',

  SOFTWARE_LICENSE_ASSIGNMENT_READ = 'software_license:assignment:read',
  SOFTWARE_LICENSE_ASSIGNMENT_CREATE = 'software_license:assignment:create',
  SOFTWARE_LICENSE_ASSIGNMENT_DELETE = 'software_license:assignment:delete',

  SOFTWARE_LICENSE_DASHBOARD_READ = 'software_license:dashboard:read',
  SOFTWARE_LICENSE_EXPIRING_READ = 'software_license:expiring:read',
}

/**
 * Users who can view software-license information.
 */
const VIEWER_PERMISSIONS: Permission[] = [
  Permission.SOFTWARE_LICENSE_READ,
];

/**
 * Staff who manage licenses and assignments.
 */
const LICENSE_EDITOR_PERMISSIONS: Permission[] = [
  Permission.SOFTWARE_LICENSE_READ,
  Permission.SOFTWARE_LICENSE_CREATE,
  Permission.SOFTWARE_LICENSE_UPDATE,
  Permission.SOFTWARE_LICENSE_ASSIGNMENT_READ,
  Permission.SOFTWARE_LICENSE_ASSIGNMENT_CREATE,
  Permission.SOFTWARE_LICENSE_ASSIGNMENT_DELETE,
  Permission.SOFTWARE_LICENSE_EXPIRING_READ,
];

/**
 * License administrators have all software-license permissions.
 */
const LICENSE_ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Readonly<
  Record<SubsystemRole, readonly Permission[]>
> = Object.freeze({
  [SubsystemRole.VIEWER]: Object.freeze(VIEWER_PERMISSIONS),
  [SubsystemRole.LICENSE_EDITOR]: Object.freeze(LICENSE_EDITOR_PERMISSIONS),
  [SubsystemRole.LICENSE_ADMIN]: Object.freeze(LICENSE_ADMIN_PERMISSIONS),
});

/**
 * Does this subsystem role hold the given permission?
 */
export function can(
  role: SubsystemRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Does this subsystem role hold at least one of the given permissions?
 */
export function canAny(
  role: SubsystemRole,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => can(role, permission));
}