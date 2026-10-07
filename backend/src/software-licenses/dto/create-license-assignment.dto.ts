import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLicenseAssignmentDto {
  @ApiProperty({
    description: 'รหัสผู้ใช้จาก Core Hub',
    example: 'user-001',
  })
  @IsString()
  @IsNotEmpty()
  core_user_id!: string;
}
