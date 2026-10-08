import { Controller, Get, Headers, HttpStatus, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AppException } from '../common/errors';
import { AuthEventsLogger } from './auth-events.logger';
import { TokenRejectionReason, TokenVerificationError } from './auth.errors';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { Public } from './decorators/public.decorator';
import { SsoCallbackQueryDto } from './dto/sso-callback.dto';
import { mapCoreRoleToSubsystemRole } from './role-mapping';
import {
  buildSsoCookie,
  deleteSsoStateCookie,
  parseSsoStateCookie,
  readCookie,
  SSO_STATE_COOKIE_NAME,
  timingSafeEqual,
} from './sso-session';

/**
 * Central SSO callback - the destination Core Hub has on file in the Subsystem
 * Registry (`GET /auth/callback`, outside the `/api` prefix).
 *
 * It reuses the existing verification chain unchanged:
 *   CoreHubTokenVerifier -> JwksService (RS256, kid, iss, aud, exp)
 * and then establishes an authenticated browser context by storing the very
 * same Core Hub token in an HttpOnly cookie. The subsystem still issues no
 * token, no session record and no credential of its own.
 */
@Controller('auth')
export class SsoCallbackController {
  constructor(
    private readonly verifier: CoreHubTokenVerifier,
    private readonly authEvents: AuthEventsLogger,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('callback')
  async callback(
    @Query() query: SsoCallbackQueryDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Headers('accept') accept?: string,
  ) {
    const secure = this.config.get<string>('nodeEnv') === 'production';
    const stateCookie = readCookie(request.headers.cookie, SSO_STATE_COOKIE_NAME);

    if (!query.state || !stateCookie) {
      this.authEvents.jwtRejected({
        reason: TokenRejectionReason.MALFORMED_TOKEN,
        path: '/auth/callback',
      });
      throw AppException.unauthorized('Missing SSO state');
    }

    const parsedStateCookie = parseSsoStateCookie(stateCookie);

    if (!parsedStateCookie || !timingSafeEqual(parsedStateCookie.state, query.state)) {
      response.setHeader('Set-Cookie', [deleteSsoStateCookie(secure)]);
      throw AppException.unauthorized('SSO state mismatch');
    }

    let payload;

    try {
      payload = await this.verifier.verify(query.access_token);
    } catch (error) {
      const reason =
        error instanceof TokenVerificationError
          ? error.reason
          : TokenRejectionReason.MALFORMED_TOKEN;
      const kid = error instanceof TokenVerificationError ? error.kid : undefined;

      this.authEvents.jwtRejected({ reason, kid, path: '/auth/callback' });

      throw AppException.unauthorized(
        'The Core Hub SSO token could not be verified',
      );
    }

    const subsystemRole = mapCoreRoleToSubsystemRole(payload.role);

    if (!subsystemRole) {
      this.authEvents.roleMappingFailed({ sub: payload.sub, coreRole: payload.role });

      throw AppException.forbidden(
        'Your Core Hub role has no access to this subsystem',
      );
    }

    const expiresInSec = this.remainingLifetimeSec(payload.exp);
    const redirectPath = this.normaliseNextPath(parsedStateCookie.next);

    response.setHeader('Set-Cookie', [
      buildSsoCookie(
        query.access_token,
        expiresInSec,
        secure,
      ),
      deleteSsoStateCookie(secure),
    ]);

    this.authEvents.jwtVerified({
      sub: payload.sub,
      coreRole: payload.role,
      subsystemRole,
    });

    if (accept?.includes('text/html')) {
      response.status(HttpStatus.FOUND).location(redirectPath);
      return;
    }

    return {
      id: payload.sub,
      email: payload.email ?? '',
      coreRole: payload.role,
      subsystemRole,
      session: {
        source: 'core-hub-sso',
        expiresIn: expiresInSec,
      },
      ...(query.state !== undefined && { state: query.state }),
    };
  }

  private remainingLifetimeSec(exp: number | undefined): number {
    if (typeof exp !== 'number') {
      return 0;
    }

    return Math.max(0, exp - Math.floor(Date.now() / 1000));
  }

  private normaliseNextPath(next: string | null | undefined): string {
    const candidate = next ?? '/';

    if (!candidate.startsWith('/')) {
      return '/';
    }

    if (candidate.startsWith('//') || candidate.includes('\\')) {
      return '/';
    }

    if (candidate === '/auth' || candidate.startsWith('/auth/')) {
      return '/';
    }

    return candidate;
  }
}
