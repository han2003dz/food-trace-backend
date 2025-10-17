import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { UserAvatar } from '../types/user.interface'
import { IsValidAvatar } from './../../../validators/is-valid-avatar.validator'

export class UpdateAvatarDto {
  @Expose({ name: 'avatar' })
  @ApiProperty({
    name: 'avatar',
    type: 'array',
    items: {
      type: 'object',
      properties: { parameter: { type: 'number' }, id: { type: 'string' } },
    },
  })
  @IsNotEmpty()
  @IsValidAvatar()
  avatar: UserAvatar[]
}
