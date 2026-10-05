import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    softwareLicenseId: string;
    coreUserId: string;
    action: string;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        softwareLicenseId: params.softwareLicenseId,
        coreUserId: params.coreUserId,
        action: params.action,
        fieldName: params.fieldName,
        oldValue: params.oldValue,
        newValue: params.newValue,
      },
    });
  }
}