import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator'

export enum OrgType {
  PRODUCER = 'PRODUCER',
  PROCESSOR = 'PROCESSOR',
  TRANSPORTER = 'TRANSPORTER',
  RETAILER = 'RETAILER',
  AUDITOR = 'AUDITOR',
}

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  location: string

  @IsEnum(OrgType)
  org_type: OrgType

  @IsString()
  @IsOptional()
  metadata_cid?: string

  @IsBoolean()
  @IsOptional()
  active?: boolean
}
