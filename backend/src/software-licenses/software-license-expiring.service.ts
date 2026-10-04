import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SoftwareLicenseExpiringService {
  constructor(private readonly prisma: PrismaService) {}

  async findExpiring() {
    const now = new Date();

    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const licenses = await this.prisma.softwareLicense.findMany({
      where: {
        deletedAt: null,
        expiryDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        assignments: {
          where: {
            deletedAt: null,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return licenses.map((license) => {
      const millisecondsPerDay = 1000 * 60 * 60 * 24;

      const daysRemaining = Math.ceil(
        (license.expiryDate.getTime() - now.getTime()) /
          millisecondsPerDay,
      );

      return {
        id: license.id,
        software_name: license.softwareName,
        expiry_date: license.expiryDate.toISOString(),
        days_remaining: daysRemaining,
        license_quantity: license.licenseQuantity,
        assigned_count: license.assignments.length,
        status: license.status,
      };
    });
  }
}