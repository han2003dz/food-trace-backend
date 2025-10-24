import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
// import { v4 as uuidv4 } from 'uuid'
import { UserService } from '../user/user.service'
import { SignInDto, SignInResponseDto } from './dto/sign-in.dto'
import { Cacheable } from 'cacheable'
import { GetNonceDto } from './dto/get-nonce.dto'
import { ethers } from 'ethers'
import { CACHE_INSTANCE } from './../../common/constant/provider.constant'
import { JwtPayload } from './../../common/interfaces/jwt-payload.interface'
import { verifyMessage } from '@ambire/signature-validator'
import { randomBytes } from 'crypto'

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
    role,
  }: SignInDto): Promise<SignInResponseDto> {
    try {
      const { isValid, message } = await this.verifyMessage({
        wallet_address,
        signature,
        role,
      } as any)
      if (!isValid) throw new UnauthorizedException(message)

      const user = await this.userService.firstOrCreate(wallet_address, role)

      const payload: JwtPayload = {
        sub: user.id,
        wallet_address: user.wallet_address,
      }
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
    const nonce = randomBytes(16).toString('hex')
    console.log('nonce', nonce)
    this.cacheable.set(walletAddress, nonce, 5 * 60 * 1000)
    return { nonce }
  }

  async verifyMessage({
    signature,
    wallet_address,
  }: Pick<SignInDto, 'signature' | 'wallet_address'>) {
    const nonce: string = await this.cacheable.get(wallet_address)
    if (!nonce) {
      this.logger.error('Nonce not found for wallet:', wallet_address)
      throw new UnauthorizedException('Nonce expired or not found')
    }

    try {
      const rpcUrl =
        this.configService.get<string>('RPC_URL') ||
        'https://base-sepolia.g.alchemy.com/v2/DBlnw4bjxz49De-lz9_Qu'
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

      const isValidSig = await verifyMessage({
        signer: wallet_address,
        message: nonce,
        signature,
        provider,
      })

      console.log('isValid', isValidSig)

      if (!isValidSig) {
        this.logger.warn(
          `Signature verification failed for wallet: ${wallet_address}`,
        )
        return {
          isValid: false,
          message: 'Invalid signature!',
        }
      }

      return {
        isValid: true,
        message: null,
      }
    } catch (error) {
      this.logger.error('Signature verification failed:', error)
      return {
        isValid: false,
        message: 'Signature verification failed',
      }
    }
  }
}
