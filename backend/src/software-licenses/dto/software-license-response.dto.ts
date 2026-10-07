import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SoftwareLicenseStatus } from '../../../generated/prisma/client';

export class SoftwareLicenseResponseDto {
  @ApiProperty({
    example: '0ab9ce14-29ae-45d1-a0ed-a0b9d5f851a3',
  })
  id!: string;

  @ApiProperty({
    example: 'Microsoft Office 365',
  })
  software_name!: string;

  @ApiPropertyOptional({
    example: 'Microsoft',
    nullable: true,
  })
  provider!: string | null;

  @ApiPropertyOptional({
    example: 'Subscription',
    nullable: true,
  })
  license_type!: string | null;

  @ApiProperty({
    example: 10,
    minimum: 1,
    type: 'integer',
    format: 'int32',
  })
  license_quantity!: number;

  @ApiPropertyOptional({
    example: '2026-10-05T00:00:00.000Z',
    nullable: true,
    format: 'date-time',
  })
  start_date!: Date | null;

  @ApiProperty({
    example: '2027-10-05T23:59:59.000Z',
    format: 'date-time',
  })
  expiry_date!: Date;

  @ApiPropertyOptional({
    example: 12000,
    minimum: 0,
    type: 'integer',
    format: 'int32',
    nullable: true,
  })
  cost!: number | null;

  @ApiProperty({
    example: 'THB',
  })
  currency!: string;

  @ApiProperty({
    enum: SoftwareLicenseStatus,
    example: SoftwareLicenseStatus.ACTIVE,
  })
  status!: SoftwareLicenseStatus;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    format: 'date-time',
  })
  deleted_at!: Date | null;

  @ApiProperty({
    example: '2026-10-05T10:00:00.000Z',
    format: 'date-time',
  })
  created_at!: Date;

  @ApiProperty({
    example: '2026-10-05T10:00:00.000Z',
    format: 'date-time',
  })
  updated_at!: Date;

  @ApiProperty({
    example: 3,
    minimum: 0,
    type: 'integer',
    format: 'int32',
  })
  assigned_count!: number;

  @ApiProperty({
    example: 7,
    minimum: 0,
    type: 'integer',
    format: 'int32',
  })
  remaining_count!: number;
}