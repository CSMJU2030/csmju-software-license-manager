import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return {
      success: true,
      data: {
        status: 'ok',
        service: 'csmju-software-license-manager',
      },
    };
  }
}