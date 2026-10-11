import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthEventsLogger } from '../auth-events.logger';
import { CoreHubIdentity, SubsystemRole } from '../core-hub-identity';
import { Permission } from '../permissions';
import { PermissionsGuard } from './permissions.guard';

function contextFor(user?: CoreHubIdentity): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        path: '/api/v1/software-licenses',
      }),
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function identity(role: SubsystemRole): CoreHubIdentity {
  return {
    id: 'user-001',
    email: 'user@core.local',
    coreRole: role.toLowerCase(),
    subsystemRole: role,
  };
}

describe('PermissionsGuard - authorization tests', () => {
  const reflector = new Reflector();
  const guard = new PermissionsGuard(reflector, new AuthEventsLogger());

  function requirePermissions(...permissions: Permission[]): void {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permissions);
  }

  afterEach(() => jest.restoreAllMocks());

  it('allows a route with no permission metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(
      guard.canActivate(contextFor(identity(SubsystemRole.VIEWER))),
    ).toBe(true);
  });

  it('allows VIEWER to read dashboard information', () => {
    requirePermissions(Permission.SOFTWARE_LICENSE_DASHBOARD_READ);

    expect(
      guard.canActivate(contextFor(identity(SubsystemRole.VIEWER))),
    ).toBe(true);
  });

  it('allows VIEWER to read license assignments', () => {
    requirePermissions(Permission.SOFTWARE_LICENSE_ASSIGNMENT_READ);

    expect(
      guard.canActivate(contextFor(identity(SubsystemRole.VIEWER))),
    ).toBe(true);
  });

  it('allows LICENSE_ADMIN to create a software license', () => {
    requirePermissions(Permission.SOFTWARE_LICENSE_CREATE);

    expect(
      guard.canActivate(contextFor(identity(SubsystemRole.LICENSE_ADMIN))),
    ).toBe(true);
  });

  it('allows VIEWER to read expiring-license information', () => {
    requirePermissions(Permission.SOFTWARE_LICENSE_EXPIRING_READ);

    expect(
      guard.canActivate(contextFor(identity(SubsystemRole.VIEWER))),
    ).toBe(true);
  });

  it('denies VIEWER from creating a software license with 403', () => {
    requirePermissions(Permission.SOFTWARE_LICENSE_CREATE);

    expect(() =>
      guard.canActivate(contextFor(identity(SubsystemRole.VIEWER))),
    ).toThrow(expect.objectContaining({ status: 403 }));
  });

  it.each([
    Permission.SOFTWARE_LICENSE_CREATE,
    Permission.SOFTWARE_LICENSE_UPDATE,
    Permission.SOFTWARE_LICENSE_DELETE,
    Permission.SOFTWARE_LICENSE_ASSIGNMENT_CREATE,
    Permission.SOFTWARE_LICENSE_ASSIGNMENT_DELETE,
  ])('denies VIEWER from %s with 403', (permission) => {
    requirePermissions(permission);

    expect(() =>
      guard.canActivate(contextFor(identity(SubsystemRole.VIEWER))),
    ).toThrow(expect.objectContaining({ status: 403 }));
  });

  it.each(Object.values(Permission))(
    'allows LICENSE_ADMIN to access %s',
    (permission) => {
      requirePermissions(permission);

      expect(
        guard.canActivate(contextFor(identity(SubsystemRole.LICENSE_ADMIN))),
      ).toBe(true);
    },
  );

  it('passes when the role holds any one of the required permissions', () => {
    requirePermissions(
      Permission.SOFTWARE_LICENSE_DELETE,
      Permission.SOFTWARE_LICENSE_READ,
    );

    expect(
      guard.canActivate(contextFor(identity(SubsystemRole.VIEWER))),
    ).toBe(true);
  });

  it('returns 401 when no verified identity is present', () => {
    requirePermissions(Permission.SOFTWARE_LICENSE_READ);

    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });
});