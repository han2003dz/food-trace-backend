import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateBatchDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string

  @IsUUID()
  @IsNotEmpty()
  creator_org_id: string

  @IsString()
  @IsOptional()
  metadata_uri?: string
}
