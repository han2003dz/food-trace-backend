import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'
import { IsWalletAddress } from './../../../validators/is-wallet-address.validator'
export class CreateAdminDto {
  @ApiProperty({ name: 'wallet_address' })
  @Expose({ name: 'wallet_address' })
  @IsString()
  @IsNotEmpty()
  @IsWalletAddress()
  wallet_address: string
}
