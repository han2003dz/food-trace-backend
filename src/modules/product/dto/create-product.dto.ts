import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateProductDto {
  @ApiProperty({ example: 'Rau sạch Đà Lạt' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: 'Đà Lạt' })
  @IsString()
  @IsNotEmpty()
  origin: string

  @ApiProperty({ example: '2025-10-31' })
  @IsString()
  @IsNotEmpty()
  manufacture_date: string

  @ApiProperty({ example: '2025-12-31' })
  @IsString()
  @IsNotEmpty()
  expiry_date: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string
}
