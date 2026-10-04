import { Module } from '@nestjs/common';
import { LicenseAssignmentController } from './license-assignment.controller';
import { SoftwareLicenseController } from './software-license.controller';
import { SoftwareLicenseDashboardController } from './software-license-dashboard.controller';
import { AuditLogService } from './audit-log.service';
import { LicenseAssignmentService } from './license-assignment.service';
import { SoftwareLicenseService } from './software-license.service';
import { SoftwareLicenseDashboardService } from './software-license-dashboard.service';
import { SoftwareLicenseExpiringController } from './software-license-expiring.controller';
import { SoftwareLicenseExpiringService } from './software-license-expiring.service';

@Module({
  controllers: [
  SoftwareLicenseDashboardController,
  SoftwareLicenseExpiringController,
  SoftwareLicenseController,
  LicenseAssignmentController,
],
  providers: [
    AuditLogService,
    SoftwareLicenseService,
    LicenseAssignmentService,
    SoftwareLicenseDashboardService,
    SoftwareLicenseExpiringService,
  ],
  exports: [
    AuditLogService,
    SoftwareLicenseService,
    LicenseAssignmentService,
    SoftwareLicenseDashboardService,
    SoftwareLicenseExpiringService,
  ],
})
export class SoftwareLicenseModule {}