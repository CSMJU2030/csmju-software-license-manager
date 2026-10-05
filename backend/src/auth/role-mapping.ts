import { SubsystemRole } from './core-hub-identity';

/**
 * Core Hub role -> Software License Manager subsystem role.
 *
 * Core Hub Role    Subsystem Role
 * --------------------------------
 * student          VIEWER
 * alumni           VIEWER
 * staff            LICENSE_EDITOR
 * admin            LICENSE_ADMIN
 */
export const CORE_ROLE_TO_SUBSYSTEM_ROLE: Readonly<
  Record<string, SubsystemRole>
> = Object.freeze({
  student: SubsystemRole.VIEWER,
  alumni: SubsystemRole.VIEWER,
  staff: SubsystemRole.LICENSE_EDITOR,
  admin: SubsystemRole.LICENSE_ADMIN,
});

/**
 * Returns the subsystem role for a Core Hub role,
 * or null when the Core Hub role has no meaning in this subsystem.
 */
export function mapCoreRoleToSubsystemRole(
  coreRole: string | undefined,
): SubsystemRole | null {
  if (typeof coreRole !== 'string') {
    return null;
  }

  return (
    CORE_ROLE_TO_SUBSYSTEM_ROLE[coreRole.trim().toLowerCase()] ?? null
  );
}