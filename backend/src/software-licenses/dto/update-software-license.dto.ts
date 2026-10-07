import {
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateSoftwareLicenseDto {
  @ApiPropertyOptional({
    description: 'ชื่อซอฟต์แวร์',
    example: 'Microsoft Office 365',
  })
  @IsOptional()
  @IsString()
  software_name?: string;

  @ApiPropertyOptional({
    description: 'ผู้ให้บริการซอฟต์แวร์',
    example: 'Microsoft',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    description: 'ประเภทใบอนุญาต',
    example: 'Subscription',
  })
  @IsOptional()
  @IsString()
  license_type?: string;

  @ApiPropertyOptional({
    description: 'จำนวนสิทธิ์ใช้งาน',
    type: 'integer',
    format: 'int32',
    minimum: 1,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  license_quantity?: number;

  @ApiPropertyOptional({
    description: 'วันที่เริ่มต้นใบอนุญาตในรูปแบบ ISO 8601',
    example: '2026-10-05T00:00:00+07:00',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'วันหมดอายุใบอนุญาตในรูปแบบ ISO 8601',
    example: '2027-10-05T23:59:59+07:00',
  })
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @ApiPropertyOptional({
    description: 'ค่าใช้จ่ายเป็นจำนวนเต็ม',
    type: 'integer',
    format: 'int32',
    minimum: 0,
    example: 12000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    description: 'สกุลเงิน',
    example: 'THB',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}