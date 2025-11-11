import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator'

export class EventDto {
  @ApiProperty({ example: 1, description: 'Sequential event ID (numeric)' })
  @IsInt()
  @Min(0)
  id: number

  @ApiProperty({
    example: 'Harvested',
    description: 'Event type or action name',
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    example: { weight: 25, unit: 'kg' },
    description: 'Payload or metadata for this event',
    required: false,
  })
  @IsOptional()
  data?: Record<string, any>
}

export class CreateBatchDto {
  @ApiProperty({
    example: 'bd2bdb7b-2d9a-463b-bb3b-789abc123456',
    description: 'UUID of the product this batch belongs to',
  })
  @IsUUID()
  product_id: string

  @ApiProperty({ example: 1, description: 'Starting event ID (inclusive)' })
  @IsInt()
  @Min(0)
  from_event_id: number

  @ApiProperty({ example: 10, description: 'Ending event ID (inclusive)' })
  @IsInt()
  @Min(1)
  to_event_id: number

  @ApiProperty({
    type: [EventDto],
    description:
      'List of events included in this batch (used to compute Merkle root)',
    example: [
      { id: 1, name: 'Harvested', data: { weight: 25, unit: 'kg' } },
      { id: 2, name: 'Packaged', data: { location: 'Da Lat' } },
      { id: 3, name: 'Shipped', data: { from: 'Da Lat', to: 'HCM' } },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  events: EventDto[]
}
