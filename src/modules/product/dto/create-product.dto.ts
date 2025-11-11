import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator'

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsUUID()
  @IsNotEmpty()
  organization_id: string // FK to Organizations table

  @IsString()
  @IsOptional()
  description?: string

  @IsUrl()
  @IsOptional()
  image_url?: string

  @IsString()
  @IsOptional()
  category?: string

  @IsString()
  @IsOptional()
  storage_conditions?: string

  @IsOptional()
  nutritional_info?: Record<string, any>

  @IsString()
  @IsOptional()
  metadata_uri?: string

  @IsString()
  @IsOptional()
  metadata_hash?: string

  @IsOptional()
  onchain_product_id?: number
}
