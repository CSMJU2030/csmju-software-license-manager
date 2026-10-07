import { ApiProperty } from '@nestjs/swagger';
import { SoftwareLicenseResponseDto } from './software-license-response.dto';

export class SoftwareLicenseListMetaDto {
  @ApiProperty({
    example: 1,
    minimum: 1,
    type: 'integer',
  })
  page!: number;

  @ApiProperty({
    example: 10,
    minimum: 1,
    type: 'integer',
  })
  limit!: number;

  @ApiProperty({
    example: 25,
    minimum: 0,
    type: 'integer',
  })
  total!: number;

  @ApiProperty({
    example: 3,
    minimum: 0,
    type: 'integer',
  })
  total_pages!: number;
}

export class SoftwareLicenseListResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    type: [SoftwareLicenseResponseDto],
  })
  data!: SoftwareLicenseResponseDto[];

  @ApiProperty({
    type: SoftwareLicenseListMetaDto,
  })
  meta!: SoftwareLicenseListMetaDto;
}