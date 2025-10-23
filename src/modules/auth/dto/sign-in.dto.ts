import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'
import { IsWalletAddress } from './../../../validators/is-wallet-address.validator'

export class SignInDto {
  @ApiProperty({ name: 'wallet_address' })
  @Expose({ name: 'wallet_address' })
  @IsString()
  @IsNotEmpty()
  @IsWalletAddress()
  wallet_address: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signature: string

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  role: number
}

export class UserDto {
  @Expose({ name: 'id' })
  id: string

  @Expose({ name: 'wallet_address' })
  wallet_address: string
}

export class SignInResponseDto {
  @Expose({ name: 'access_token' })
  accessToken: string

  @Expose({ name: 'user' })
  user: UserDto
}
