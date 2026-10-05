import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CreateLicenseAssignmentDto } from './dto/create-license-assignment.dto';
import { LicenseAssignmentService } from './license-assignment.service';

@Controller('v1/software-licenses/:softwareLicenseId/assignments')
export class LicenseAssignmentController {
  constructor(
    private readonly licenseAssignmentService: LicenseAssignmentService,
  ) {}

  @Get()
  @RequirePermissions(Permission.SOFTWARE_LICENSE_ASSIGNMENT_READ)
  async findAll(@Param('softwareLicenseId') softwareLicenseId: string) {
    const assignments =
      await this.licenseAssignmentService.findAll(softwareLicenseId);

    return {
      success: true,
      data: assignments,
    };
  }

  @Post()
  @RequirePermissions(Permission.SOFTWARE_LICENSE_ASSIGNMENT_CREATE)
  async create(
    @Param('softwareLicenseId') softwareLicenseId: string,
    @Body() dto: CreateLicenseAssignmentDto,
  ) {
    const assignment = await this.licenseAssignmentService.create(
      softwareLicenseId,
      dto,
    );

    return {
      success: true,
      data: assignment,
    };
  }

  @Delete(':assignmentId')
  @RequirePermissions(Permission.SOFTWARE_LICENSE_ASSIGNMENT_DELETE)
  async remove(
    @Param('softwareLicenseId') softwareLicenseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    const assignment = await this.licenseAssignmentService.remove(
      softwareLicenseId,
      assignmentId,
    );

    return {
      success: true,
      data: {
        id: assignment.id,
        deleted: true,
      },
    };
  }
}