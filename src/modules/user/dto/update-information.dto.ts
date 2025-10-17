import { ApiProperty } from '@nestjs/swagger'
import { IsObject } from 'class-validator'

export class UpdateInformationDto {
  // @ApiProperty({ name: 'user_id' })
  // @Expose({ name: 'user_id' })
  // @IsNotEmpty()
  // user_id: string

  // @ApiProperty()
  // @IsNotEmpty()
  // signature: string

  @ApiProperty({ name: 'data' })
  @IsObject()
  data: Record<string, any>
}
