import { Injectable } from '@nestjs/common';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLicenseAssignmentDto } from './dto/create-license-assignment.dto';

@Injectable()
export class LicenseAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(softwareLicenseId: string) {
    await this.ensureLicenseExists(softwareLicenseId);

    return this.prisma.licenseAssignment.findMany({
      where: {
        softwareLicenseId,
        deletedAt: null,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  async create(
  softwareLicenseId: string,
  dto: CreateLicenseAssignmentDto,
) {
  const license = await this.prisma.softwareLicense.findFirst({
    where: {
      id: softwareLicenseId,
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

  if (license.status !== 'ACTIVE') {
    throw AppException.conflict(
      'Software license is not active',
    );
  }

  const existingAssignment =
    await this.prisma.licenseAssignment.findUnique({
      where: {
        softwareLicenseId_coreUserId: {
          softwareLicenseId,
          coreUserId: dto.coreUserId,
        },
      },
    });

  if (existingAssignment && existingAssignment.deletedAt === null) {
    throw AppException.conflict(
      'This user is already assigned to the software license',
    );
  }

  const assignedCount = license.assignments.length;

  if (assignedCount >= license.licenseQuantity) {
    throw new AppException(
      'LICENSE_LIMIT_REACHED',
      'License assignment limit has been reached',
      409,
    );
  }

  if (existingAssignment) {
    return this.prisma.licenseAssignment.update({
      where: {
        id: existingAssignment.id,
      },
      data: {
        deletedAt: null,
        assignedAt: new Date(),
      },
    });
  }

  return this.prisma.licenseAssignment.create({
    data: {
      softwareLicenseId,
      coreUserId: dto.coreUserId,
    },
  });
}

  async remove(softwareLicenseId: string, assignmentId: string) {
    const assignment = await this.prisma.licenseAssignment.findFirst({
      where: {
        id: assignmentId,
        softwareLicenseId,
        deletedAt: null,
      },
    });

    if (!assignment) {
      throw AppException.notFound('License assignment not found');
    }

    return this.prisma.licenseAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private async ensureLicenseExists(softwareLicenseId: string) {
    const license = await this.prisma.softwareLicense.findFirst({
      where: {
        id: softwareLicenseId,
        deletedAt: null,
      },
    });

    if (!license) {
      throw AppException.notFound('Software license not found');
    }
  }
}
