import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'
import { IsWalletAddress } from './../../../validators/is-wallet-address.validator'

export class GetNonceDto {
  @ApiProperty({ name: 'address' })
  @Expose({ name: 'address' })
  @IsString()
  @IsNotEmpty()
  @IsWalletAddress()
  walletAddress: string
}
