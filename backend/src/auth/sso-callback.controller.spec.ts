import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { AuthEventsLogger } from './auth-events.logger';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { SsoCallbackController } from './sso-callback.controller';

describe('SsoCallbackController', () => {
  let controller: SsoCallbackController;
  let verifier: jest.Mocked<Pick<CoreHubTokenVerifier, 'verify'>>;
  let authEvents: jest.Mocked<Pick<AuthEventsLogger, 'jwtRejected'>>;
  let config: jest.Mocked<Pick<ConfigService, 'get'>>;
  let response: jest.Mocked<
    Pick<Response, 'setHeader' | 'status' | 'location'>
  >;

  beforeEach(() => {
    verifier = {
      verify: jest.fn(),
    };
    authEvents = {
      jwtRejected: jest.fn(),
    };
    config = {
      get: jest.fn().mockReturnValue('production'),
    };
    response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      location: jest.fn().mockReturnThis(),
    };

    controller = new SsoCallbackController(
      verifier as unknown as CoreHubTokenVerifier,
      authEvents as unknown as AuthEventsLogger,
      config as unknown as ConfigService,
    );
  });

  it('discards a state-less Core Hub handoff and starts a stateful login', async () => {
    await controller.callback(
      { access_token: 'untrusted-token' },
      { headers: {} } as Request,
      response as unknown as Response,
      'text/html',
    );

    expect(response.status).toHaveBeenCalledWith(302);
    expect(response.location).toHaveBeenCalledWith('/auth/login');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'no-referrer',
    );
    expect(response.setHeader).not.toHaveBeenCalledWith(
      'Set-Cookie',
      expect.anything(),
    );
    expect(verifier.verify).not.toHaveBeenCalled();
    expect(authEvents.jwtRejected).not.toHaveBeenCalled();
  });
});
