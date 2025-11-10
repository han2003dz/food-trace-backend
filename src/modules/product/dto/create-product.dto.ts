import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

class CertificationDto {
  @ApiProperty({ example: 'VietGAP' })
  @IsString()
  @IsNotEmpty()
  type: string

  @ApiProperty({ example: 'Bộ NN&PTNT' })
  @IsString()
  @IsNotEmpty()
  issuer: string

  @ApiProperty({ example: 'VG-2025-001' })
  @IsString()
  @IsNotEmpty()
  id: string
}

export class CreateProductDto {
  @ApiProperty({ example: 'Rau sạch Đà Lạt' })
  @IsString()
  @IsNotEmpty()
  product_name: string

  @ApiProperty({ example: 'Đà Lạt' })
  @IsString()
  @IsNotEmpty()
  origin: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category_id: string

  @ApiProperty({ example: 'Công ty TNHH Rau xanh đà lạt' })
  @IsString()
  @IsNotEmpty()
  producer_name: string

  @ApiProperty({ example: '2025-10-31' })
  @IsString()
  @IsNotEmpty()
  manufacture_date: string

  @ApiProperty({ example: '2025-12-31' })
  @IsString()
  @IsNotEmpty()
  expiry_date: string

  @ApiProperty({ example: 'Rau được trồng hữu cơ tại cao nguyên Đà Lạt.' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string

  @ApiProperty({
    type: [CertificationDto],
    required: false,
    description: 'Danh sách chứng nhận chất lượng / nguồn gốc sản phẩm',
  })
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  @IsOptional()
  certifications?: CertificationDto[]

  @ApiProperty({
    example: 'Bảo quản ở nhiệt độ 18°C - 22°C, tránh ánh nắng trực tiếp.',
    required: false,
  })
  @IsOptional()
  @IsString()
  storage_conditions?: string

  @ApiProperty({
    example: { calories: 50, protein: '2g', fat: '0.3g' },
    required: false,
  })
  @IsOptional()
  nutritional_info?: Record<string, any>
}
