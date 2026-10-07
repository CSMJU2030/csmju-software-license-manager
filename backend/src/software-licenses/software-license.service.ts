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

      return {
        id: license.id,
        software_name: license.softwareName,
        provider: license.provider,
        license_type: license.licenseType,
        license_quantity: license.licenseQuantity,
        start_date: license.startDate,
        expiry_date: license.expiryDate,
        cost: license.cost,
        currency: license.currency,
        status: license.status,
        deleted_at: license.deletedAt,
        created_at: license.createdAt,
        updated_at: license.updatedAt,
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

    return {
      id: license.id,
      software_name: license.softwareName,
      provider: license.provider,
      license_type: license.licenseType,
      license_quantity: license.licenseQuantity,
      start_date: license.startDate,
      expiry_date: license.expiryDate,
      cost: license.cost,
      currency: license.currency,
      status: license.status,
      deleted_at: license.deletedAt,
      created_at: license.createdAt,
      updated_at: license.updatedAt,
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
      ...(dto.software_name !== undefined && {
        softwareName: dto.software_name,
      }),
      ...(dto.provider !== undefined && {
        provider: dto.provider,
      }),
      ...(dto.license_type !== undefined && {
        licenseType: dto.license_type,
      }),
      ...(dto.license_quantity !== undefined && {
        licenseQuantity: dto.license_quantity,
      }),
      ...(dto.start_date !== undefined && {
        startDate: new Date(dto.start_date),
      }),
      ...(dto.expiry_date !== undefined && {
        expiryDate: new Date(dto.expiry_date),
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

    const effectiveStartDate =
      dto.start_date !== undefined
        ? new Date(dto.start_date)
        : existingLicense.startDate;

    const effectiveExpiryDate =
      dto.expiry_date !== undefined
        ? new Date(dto.expiry_date)
        : existingLicense.expiryDate;

    if (
      effectiveStartDate &&
      effectiveExpiryDate < effectiveStartDate
    ) {
      throw AppException.badRequest(
        'Expiry date cannot be before start date',
      );
    }

    if (dto.license_quantity !== undefined) {
      const assignedCount = await this.prisma.licenseAssignment.count({
        where: {
          softwareLicenseId: id,
          deletedAt: null,
        },
      });

      if (dto.license_quantity < assignedCount) {
        throw AppException.conflict(
          'License quantity cannot be less than assigned count',
          {
            assignedCount,
            requestedQuantity: dto.license_quantity,
          },
        );
      }
    }

    await this.prisma.softwareLicense.update({
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

    return this.findOne(id);
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

  async create(
    dto: CreateSoftwareLicenseDto,
    coreUserId: string,
  ) {
    if (dto.start_date) {
      const startDate = new Date(dto.start_date);
      const expiryDate = new Date(dto.expiry_date);

      if (expiryDate < startDate) {
        throw AppException.badRequest(
          'Expiry date cannot be before start date',
        );
      }
    }

    const license = await this.prisma.softwareLicense.create({
      data: {
        softwareName: dto.software_name,
        provider: dto.provider,
        licenseType: dto.license_type,
        licenseQuantity: dto.license_quantity,
        startDate: dto.start_date
          ? new Date(dto.start_date)
          : undefined,
        expiryDate: new Date(dto.expiry_date),
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

    return this.findOne(license.id);
  }
}