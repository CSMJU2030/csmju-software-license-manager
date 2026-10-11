import { SubsystemRole } from './core-hub-identity';
import { mapCoreRoleToSubsystemRole } from './role-mapping';

describe('Core role -> subsystem role mapping', () => {
  it.each([
    ['student', SubsystemRole.VIEWER],
    ['alumni', SubsystemRole.VIEWER],
    ['staff', SubsystemRole.VIEWER],
    ['lecturer', SubsystemRole.VIEWER],
    ['admin', SubsystemRole.LICENSE_ADMIN],
  ])('maps core role "%s" to %s', (coreRole, expected) => {
    expect(mapCoreRoleToSubsystemRole(coreRole)).toBe(expected);
  });

  it('is case and whitespace tolerant', () => {
    expect(mapCoreRoleToSubsystemRole('  STAFF ')).toBe(
      SubsystemRole.VIEWER,
    );

    expect(mapCoreRoleToSubsystemRole(' ADMIN ')).toBe(
      SubsystemRole.LICENSE_ADMIN,
    );
  });

  it('returns null for a Core Hub role this subsystem does not know', () => {
    expect(mapCoreRoleToSubsystemRole('finance-officer')).toBeNull();
    expect(mapCoreRoleToSubsystemRole('guest')).toBeNull();
  });

  it('returns null when the token carries no role claim', () => {
    expect(mapCoreRoleToSubsystemRole(undefined)).toBeNull();
  });
});