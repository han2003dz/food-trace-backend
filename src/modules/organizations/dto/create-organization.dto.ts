import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator'

export enum OrgType {
  FARM = 'FARM',
  PROCESSOR = 'PROCESSOR',
  LOGISTICS = 'LOGISTICS',
  RETAILER = 'RETAILER',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN',
}

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsEnum(OrgType)
  org_type: OrgType

  @IsString()
  @IsNotEmpty()
  wallet_address: string

  @IsString()
  @IsOptional()
  metadata_cid?: string

  @IsBoolean()
  @IsOptional()
  active?: boolean
}
