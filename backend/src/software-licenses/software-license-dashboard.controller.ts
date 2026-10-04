import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { SoftwareLicenseDashboardService } from './software-license-dashboard.service';

@Controller('v1/software-license-dashboard')
export class SoftwareLicenseDashboardController {
  constructor(
    private readonly dashboardService: SoftwareLicenseDashboardService,
  ) {}

  @Get()
  @RequirePermissions(Permission.SOFTWARE_LICENSE_DASHBOARD_READ)
  async getDashboard() {
    const dashboard = await this.dashboardService.getDashboard();

    return {
      success: true,
      data: dashboard,
    };
  }
}