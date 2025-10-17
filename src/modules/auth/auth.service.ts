import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { v4 as uuidv4 } from 'uuid'
import { UserService } from '../user/user.service'
import { SignInDto, SignInResponseDto } from './dto/sign-in.dto'
import { Cacheable } from 'cacheable'
import { GetNonceDto } from './dto/get-nonce.dto'
import { ethers } from 'ethers'
import { CACHE_INSTANCE } from './../../common/constant/provider.constant'
import { JwtPayload } from './../../common/interfaces/jwt-payload.interface'

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name)

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private readonly configService: ConfigService,
    @Inject(CACHE_INSTANCE) private cacheable: Cacheable,
  ) {
    this.logger.log('AuthService instantiated')
  }

  async signIn({
    signature,
    wallet_address,
  }: SignInDto): Promise<SignInResponseDto> {
    try {
      const { isValid, message } = await this.verifyMessage({
        wallet_address,
        signature,
      })
      if (!isValid) throw new UnauthorizedException(message)

      const user = await this.userService.firstOrCreate(wallet_address)
      const payload = {
        sub: user.id,
        wallet_address: user.wallet_address,
      } as JwtPayload
      const response = new SignInResponseDto()
      response.accessToken = await this.jwtService.signAsync(payload)

      response.user = user
      this.cacheable.delete(wallet_address)
      return response
    } catch (error) {
      this.logger.error('Auth Guard error: ', error)
      throw new UnauthorizedException()
    }
  }

  async getNonce({ walletAddress }: GetNonceDto) {
    const nonce = uuidv4()
    this.cacheable.set(walletAddress, nonce, 5 * 60 * 1000)
    return { nonce }
  }

  async verifyMessage({ signature, wallet_address }: SignInDto) {
    const nonce: string = await this.cacheable.get(wallet_address)
    if (!nonce) {
      this.logger.error('Nonce not found')
      throw new UnauthorizedException()
    }

    const isValid =
      ethers.utils.verifyMessage(nonce, signature) === wallet_address

    return {
      isValid,
      message: !isValid ? 'Invalid signature!' : null,
    }
  }
}
