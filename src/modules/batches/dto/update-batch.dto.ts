import { BatchEventType } from '@app/common/enums/batch.enum'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class UpdateBatchStatusDto {
  @IsEnum(BatchEventType)
  event_type: BatchEventType

  @IsOptional()
  @IsString()
  metadata_uri?: string

  @IsOptional()
  @IsString()
  receiver_wallet?: string
}
