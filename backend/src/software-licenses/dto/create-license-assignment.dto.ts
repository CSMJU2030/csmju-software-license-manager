import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLicenseAssignmentDto {
  @IsString()
  @IsNotEmpty()
  coreUserId!: string;
}