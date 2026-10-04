import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SoftwareLicenseDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const licenses = await this.prisma.softwareLicense.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        assignments: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    const totalSoftware = new Set(
      licenses.map((license) => license.softwareName),
    ).size;

    const totalLicenses = licenses.reduce(
      (sum, license) => sum + license.licenseQuantity,
      0,
    );

    const assignedLicenses = licenses.reduce(
      (sum, license) => sum + license.assignments.length,
      0,
    );

    const remainingLicenses = totalLicenses - assignedLicenses;

    const now = new Date();

    const expired = licenses.filter(
      (license) => license.expiryDate.getTime() < now.getTime(),
    ).length;

    const expiringSoon = licenses.filter((license) => {
      const diffMs = license.expiryDate.getTime() - now.getTime();

      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      return diffMs >= 0 && diffMs <= thirtyDaysMs;
    }).length;

    const totalCost = licenses.reduce(
      (sum, license) => sum + (license.cost ?? 0),
      0,
    );

    return {
      total_software: totalSoftware,
      total_licenses: totalLicenses,
      assigned_licenses: assignedLicenses,
      remaining_licenses: remainingLicenses,
      expiring_soon: expiringSoon,
      expired,
      total_cost: totalCost,
    };
  }
}