import { Controller, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { Public } from './decorators/public.decorator';
import { SSO_COOKIE_NAME } from './sso-session';

@Controller('auth')
export class SsoLogoutController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Post('logout')
  logout(@Res() response: Response) {
    const coreHubWebUrl =
      this.config.get<string>('coreHubWebUrl') ??
      this.config.get<string>('coreHubUrl') ??
      process.env.CORE_HUB_WEB_URL ??
      process.env.CORE_HUB_URL ??
      'http://localhost:3000';

    const secure =
      this.config.get<string>('nodeEnv') === 'production';

    const cookieAttributes = [
      `${SSO_COOKIE_NAME}=`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=0',
    ];

    if (secure) {
      cookieAttributes.push('Secure');
    }

    response.setHeader('Set-Cookie', cookieAttributes.join('; '));
    response.setHeader('Cache-Control', 'no-store');

    return response.redirect(303, `${coreHubWebUrl}/logout`);
  }
}
