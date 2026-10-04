import { Injectable } from '@nestjs/common';
import { SoftwareLicenseStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSoftwareLicenseDto } from './dto/create-software-license.dto';
import { UpdateSoftwareLicenseDto } from './dto/update-software-license.dto';
import { AppException } from '../common/errors';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class SoftwareLicenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(
    softwareName?: string,
    provider?: string,
    status?: SoftwareLicenseStatus,
  ) {
    const licenses = await this.prisma.softwareLicense.findMany({
      where: {
        deletedAt: null,

        ...(softwareName
          ? {
              softwareName: {
                contains: softwareName,
                mode: 'insensitive',
              },
            }
          : {}),

        ...(provider
          ? {
              provider: {
                contains: provider,
                mode: 'insensitive',
              },
            }
          : {}),

        ...(status
          ? {
              status,
            }
          : {}),
      },

      include: {
        assignments: {
          where: {
            deletedAt: null,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return licenses.map((license) => {
      const assignedCount = license.assignments.length;
      const remainingCount = Math.max(
        license.licenseQuantity - assignedCount,
        0,
      );

     const { assignments, ...licenseData } = license;
void assignments;

      return {
        ...licenseData,
        assigned_count: assignedCount,
        remaining_count: remainingCount,
      };
    });
  }

  async findOne(id: string) {
    const license = await this.prisma.softwareLicense.findFirst({
      where: {
        id,
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

    if (!license) {
      throw AppException.notFound('Software license not found');
    }

    const assignedCount = license.assignments.length;
    const remainingCount = Math.max(
      license.licenseQuantity - assignedCount,
      0,
    );

    const { assignments, ...licenseData } = license;
void assignments;

    return {
      ...licenseData,
      assigned_count: assignedCount,
      remaining_count: remainingCount,
    };
  }

  async update(
    id: string,
    dto: UpdateSoftwareLicenseDto,
    coreUserId: string,
  ) {
    const data = {
      ...(dto.softwareName !== undefined && {
        softwareName: dto.softwareName,
      }),
      ...(dto.provider !== undefined && {
        provider: dto.provider,
      }),
      ...(dto.licenseType !== undefined && {
        licenseType: dto.licenseType,
      }),
      ...(dto.licenseQuantity !== undefined && {
        licenseQuantity: dto.licenseQuantity,
      }),
      ...(dto.startDate !== undefined && {
        startDate: new Date(dto.startDate),
      }),
      ...(dto.expiryDate !== undefined && {
        expiryDate: new Date(dto.expiryDate),
      }),
      ...(dto.cost !== undefined && {
        cost: dto.cost,
      }),
      ...(dto.currency !== undefined && {
        currency: dto.currency,
      }),
    };

    const existingLicense = await this.prisma.softwareLicense.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingLicense) {
      throw AppException.notFound('Software license not found');
    }

    // Prevent reducing license quantity below current assigned count
    if (dto.licenseQuantity !== undefined) {
      const assignedCount = await this.prisma.licenseAssignment.count({
        where: {
          softwareLicenseId: id,
          deletedAt: null,
        },
      });

      if (dto.licenseQuantity < assignedCount) {
        throw AppException.conflict(
          'License quantity cannot be less than assigned count',
          {
            assignedCount,
            requestedQuantity: dto.licenseQuantity,
          },
        );
      }
    }

    const updatedLicense = await this.prisma.softwareLicense.update({
      where: {
        id,
      },
      data,
    });

    for (const [fieldName, newValue] of Object.entries(data)) {
      const oldValue =
        existingLicense[fieldName as keyof typeof existingLicense];

      if (oldValue !== newValue) {
        await this.auditLogService.create({
          softwareLicenseId: id,
          coreUserId,
          action: 'UPDATE',
          fieldName,
          oldValue:
            oldValue instanceof Date
              ? oldValue.toISOString()
              : oldValue === null || oldValue === undefined
                ? undefined
                : String(oldValue),
          newValue:
            newValue instanceof Date
              ? newValue.toISOString()
              : newValue === null || newValue === undefined
                ? undefined
                : String(newValue),
        });
      }
    }

    return updatedLicense;
  }

  async remove(id: string, coreUserId: string) {
    const existingLicense = await this.prisma.softwareLicense.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingLicense) {
      throw AppException.notFound('Software license not found');
    }

    const deletedAt = new Date();

    const license = await this.prisma.softwareLicense.update({
      where: {
        id,
      },
      data: {
        deletedAt,
      },
    });

    await this.auditLogService.create({
      softwareLicenseId: id,
      coreUserId,
      action: 'DELETE',
      fieldName: 'deletedAt',
      oldValue: undefined,
      newValue: deletedAt.toISOString(),
    });

    return license;
  }

  async create(dto: CreateSoftwareLicenseDto, coreUserId: string) {
    if (dto.startDate) {
      const startDate = new Date(dto.startDate);
      const expiryDate = new Date(dto.expiryDate);

      if (expiryDate < startDate) {
        throw AppException.badRequest(
          'Expiry date cannot be before start date',
        );
      }
    }

    const license = await this.prisma.softwareLicense.create({
      data: {
        softwareName: dto.softwareName,
        provider: dto.provider,
        licenseType: dto.licenseType,
        licenseQuantity: dto.licenseQuantity,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        expiryDate: new Date(dto.expiryDate),
        cost: dto.cost,
        currency: dto.currency ?? 'THB',
      },
    });

    await this.auditLogService.create({
      softwareLicenseId: license.id,
      coreUserId,
      action: 'CREATE',
      newValue: JSON.stringify(license),
    });

    return license;
  }
}