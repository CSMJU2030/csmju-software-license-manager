import { Controller, Get } from '@nestjs/common';
import { SoftwareLicenseExpiringService } from './software-license-expiring.service';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';

@Controller('v1/software-licenses/expiring')
export class SoftwareLicenseExpiringController {
  constructor(
    private readonly softwareLicenseExpiringService: SoftwareLicenseExpiringService,
  ) {}

  @Get()
  @RequirePermissions(Permission.SOFTWARE_LICENSE_EXPIRING_READ)
  async findExpiring() {
    const licenses =
      await this.softwareLicenseExpiringService.findExpiring();

    return {
      success: true,
      data: licenses,
    };
  }
}