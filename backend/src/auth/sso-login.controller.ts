import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from './decorators/public.decorator';
import { buildSsoStateCookie } from './sso-session';

const DEFAULT_NEXT_PATH = '/';
const MAX_NEXT_LENGTH = 512;
const SUBSYSTEM_NAME = 'csmju-software-license-manager';

@Controller('auth')
export class SsoLoginController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get('login')
  login(
    @Query('next') next: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const nextPath = this.resolveNextPath(next, request);
    const state = this.randomState();
    const secure = this.config.get<string>('nodeEnv') === 'production';
    const cookieValue = buildSsoStateCookie(state, nextPath, secure);

    response.setHeader('Set-Cookie', cookieValue);

    const coreHubWebUrl =
      this.config.get<string>('coreHubWebUrl') ??
      this.config.get<string>('coreHubUrl') ??
      process.env.CORE_HUB_WEB_URL ??
      process.env.CORE_HUB_URL ??
      'http://localhost:3000';

    const target = new URL(`${coreHubWebUrl}/sso/authorize`);
    target.searchParams.set('subsystem', SUBSYSTEM_NAME);
    target.searchParams.set('state', state);

    return response.redirect(302, target.toString());
  }

  private randomState(): string {
    const bytes = new Uint8Array(32);
    const randomValues = crypto.getRandomValues(bytes);
    return Buffer.from(randomValues).toString('base64url');
  }

  private resolveNextPath(next: string | undefined, request: Request): string {
    const candidate = typeof next === 'string' ? next : DEFAULT_NEXT_PATH;

    if (candidate.length < 1 || candidate.length > MAX_NEXT_LENGTH) {
      return DEFAULT_NEXT_PATH;
    }

    if (!candidate.startsWith('/')) {
      return DEFAULT_NEXT_PATH;
    }

    if (candidate.startsWith('//') || candidate.includes('\\')) {
      return DEFAULT_NEXT_PATH;
    }

    const baseOrigin = `${request.protocol}://${request.get('host') ?? 'localhost'}`;
    try {
      const url = new URL(candidate, baseOrigin);
      const sameOrigin = url.origin === new URL(baseOrigin).origin;
      const isProtectedPath = url.pathname === '/auth' || url.pathname.startsWith('/auth/');

      if (!sameOrigin || isProtectedPath) {
        return DEFAULT_NEXT_PATH;
      }

      return `${url.pathname}${url.search}${url.hash}` || DEFAULT_NEXT_PATH;
    } catch {
      return DEFAULT_NEXT_PATH;
    }
  }
}
