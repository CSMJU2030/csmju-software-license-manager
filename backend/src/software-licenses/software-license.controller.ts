import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { CreateSoftwareLicenseDto } from './dto/create-software-license.dto';
import { UpdateSoftwareLicenseDto } from './dto/update-software-license.dto';
import { SoftwareLicenseService } from './software-license.service';
import { SoftwareLicenseStatus } from '../../generated/prisma/client';

@Controller('v1/software-licenses')
export class SoftwareLicenseController {
  constructor(
    private readonly softwareLicenseService: SoftwareLicenseService,
  ) {}

  @Get()
@RequirePermissions(Permission.SOFTWARE_LICENSE_READ)
async findAll(
  @Query('software_name') softwareName?: string,
  @Query('provider') provider?: string,
  @Query('status') status?: SoftwareLicenseStatus,
  @Query('page') page = '1',
  @Query('limit') limit = '10',
) {
  const licenses = await this.softwareLicenseService.findAll(
    softwareName,
    provider,
    status,
  );

  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.min(
    Math.max(Number(limit) || 10, 1),
    100,
  );

  const start = (currentPage - 1) * currentLimit;
  const paginatedLicenses = licenses.slice(
    start,
    start + currentLimit,
  );

  return {
    success: true,
    data: paginatedLicenses,
    meta: {
      page: currentPage,
      limit: currentLimit,
      total: licenses.length,
      totalPages: Math.ceil(licenses.length / currentLimit),
    },
  };
}

  @Get(':id')
  @RequirePermissions(Permission.SOFTWARE_LICENSE_READ)
  async findOne(@Param('id') id: string) {
    const license = await this.softwareLicenseService.findOne(id);

    return {
      success: true,
      data: license,
    };
  }

  @Patch(':id')
  @RequirePermissions(Permission.SOFTWARE_LICENSE_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSoftwareLicenseDto,
    @CurrentUser() user: CoreHubIdentity,
  ) {
    const license = await this.softwareLicenseService.update(
      id,
      dto,
      user.id,
    );

    return {
      success: true,
      data: license,
    };
  }

  @Delete(':id')
  @RequirePermissions(Permission.SOFTWARE_LICENSE_DELETE)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CoreHubIdentity,
  ) {
    const license = await this.softwareLicenseService.remove(
      id,
      user.id,
    );

    return {
      success: true,
      data: {
        id: license.id,
        deleted: true,
      },
    };
  }

  @Post()
  @RequirePermissions(Permission.SOFTWARE_LICENSE_CREATE)
  async create(
    @Body() dto: CreateSoftwareLicenseDto,
    @CurrentUser() user: CoreHubIdentity,
  ) {
    const license = await this.softwareLicenseService.create(
      dto,
      user.id,
    );

    return {
      success: true,
      data: license,
    };
  }
}