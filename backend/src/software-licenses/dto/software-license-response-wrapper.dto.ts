import { ApiProperty } from '@nestjs/swagger';
import { SoftwareLicenseResponseDto } from './software-license-response.dto';

export class SoftwareLicenseResponseWrapperDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    type: SoftwareLicenseResponseDto,
  })
  data!: SoftwareLicenseResponseDto;
}