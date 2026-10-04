import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSoftwareLicenseDto {
  @IsString()
  softwareName!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  licenseType?: string;

  @IsInt()
  @Min(1)
  licenseQuantity!: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsDateString()
  expiryDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
