import { ApiProperty } from '@nestjs/swagger';

export class DeleteSoftwareLicenseDataDto {
  @ApiProperty({
    example: '0ab9ce14-29ae-45d1-a0ed-a0b9d5f851a3',
  })
  id!: string;

  @ApiProperty({
    example: true,
  })
  deleted!: boolean;
}

export class DeleteSoftwareLicenseResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    type: DeleteSoftwareLicenseDataDto,
  })
  data!: DeleteSoftwareLicenseDataDto;
}