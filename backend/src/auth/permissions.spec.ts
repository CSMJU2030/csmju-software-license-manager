import { SubsystemRole } from './core-hub-identity';
import { Permission, ROLE_PERMISSIONS, can, canAny } from './permissions';

describe('Subsystem permission model', () => {
  describe('VIEWER', () => {
    const role = SubsystemRole.VIEWER;

    it('can read software licenses', () => {
      expect(can(role, Permission.SOFTWARE_LICENSE_READ)).toBe(true);
    });

    it('cannot create, update, or delete software licenses', () => {
      expect(can(role, Permission.SOFTWARE_LICENSE_CREATE)).toBe(false);
      expect(can(role, Permission.SOFTWARE_LICENSE_UPDATE)).toBe(false);
      expect(can(role, Permission.SOFTWARE_LICENSE_DELETE)).toBe(false);
    });

    it('cannot manage license assignments', () => {
      expect(
        can(role, Permission.SOFTWARE_LICENSE_ASSIGNMENT_READ),
      ).toBe(false);
      expect(
        can(role, Permission.SOFTWARE_LICENSE_ASSIGNMENT_CREATE),
      ).toBe(false);
      expect(
        can(role, Permission.SOFTWARE_LICENSE_ASSIGNMENT_DELETE),
      ).toBe(false);
    });

    it('cannot read dashboard or expiring-license information', () => {
      expect(
        can(role, Permission.SOFTWARE_LICENSE_DASHBOARD_READ),
      ).toBe(false);
      expect(
        can(role, Permission.SOFTWARE_LICENSE_EXPIRING_READ),
      ).toBe(false);
    });
  });

  describe('LICENSE_EDITOR', () => {
    const role = SubsystemRole.LICENSE_EDITOR;

    it('can read, create, and update software licenses', () => {
      expect(can(role, Permission.SOFTWARE_LICENSE_READ)).toBe(true);
      expect(can(role, Permission.SOFTWARE_LICENSE_CREATE)).toBe(true);
      expect(can(role, Permission.SOFTWARE_LICENSE_UPDATE)).toBe(true);
    });

    it('cannot delete software licenses', () => {
      expect(can(role, Permission.SOFTWARE_LICENSE_DELETE)).toBe(false);
    });

    it('can manage license assignments', () => {
      expect(
        can(role, Permission.SOFTWARE_LICENSE_ASSIGNMENT_READ),
      ).toBe(true);
      expect(
        can(role, Permission.SOFTWARE_LICENSE_ASSIGNMENT_CREATE),
      ).toBe(true);
      expect(
        can(role, Permission.SOFTWARE_LICENSE_ASSIGNMENT_DELETE),
      ).toBe(true);
    });

    it('can read expiring-license information', () => {
      expect(
        can(role, Permission.SOFTWARE_LICENSE_EXPIRING_READ),
      ).toBe(true);
    });

    it('cannot read the dashboard', () => {
      expect(
        can(role, Permission.SOFTWARE_LICENSE_DASHBOARD_READ),
      ).toBe(false);
    });
  });

  describe('LICENSE_ADMIN', () => {
    it('holds every permission', () => {
      for (const permission of Object.values(Permission)) {
        expect(can(SubsystemRole.LICENSE_ADMIN, permission)).toBe(true);
      }
    });
  });

  it('canAny passes when at least one permission matches', () => {
    expect(
      canAny(SubsystemRole.VIEWER, [
        Permission.SOFTWARE_LICENSE_READ,
        Permission.SOFTWARE_LICENSE_CREATE,
      ]),
    ).toBe(true);

    expect(
      canAny(SubsystemRole.VIEWER, [
        Permission.SOFTWARE_LICENSE_CREATE,
        Permission.SOFTWARE_LICENSE_UPDATE,
      ]),
    ).toBe(false);

    expect(
      canAny(SubsystemRole.LICENSE_EDITOR, [
        Permission.SOFTWARE_LICENSE_DELETE,
        Permission.SOFTWARE_LICENSE_UPDATE,
      ]),
    ).toBe(true);
  });

  it('defines permissions for every subsystem role', () => {
    for (const role of Object.values(SubsystemRole)) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });
});