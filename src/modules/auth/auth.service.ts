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
    const nonce = uuidv4()
    this.cacheable.set(walletAddress, nonce, 5 * 60 * 1000)
    return { nonce }
  }

  async verifyMessage({
    signature,
    wallet_address,
  }: Pick<SignInDto, 'signature' | 'wallet_address'>) {
    const nonce: string = await this.cacheable.get(wallet_address)
    if (!nonce) {
      this.logger.error('Nonce not found')
      throw new UnauthorizedException('Nonce expired or not found')
    }

    const provider = new ethers.providers.JsonRpcProvider(
      this.configService.get<string>('RPC_URL'),
    )

    const isValidSig = await verifyMessage({
      signer: wallet_address,
      message: nonce,
      signature,
      provider,
    })
    if (!isValidSig) {
      await this.logService.logError(
        `Signature verification failed for wallet: ${address}`,
        'login',
      )
      return {
        isSuccess: false,
        message: 'Invalid signature!',
      }
    }

    // const messageHash = ethers.utils.hashMessage(nonce)
    // const sig = signature.trim()

    // if (sig.length === 132) {
    //   try {
    //     const recovered = ethers.utils.verifyMessage(nonce, sig).toLowerCase()
    //     if (recovered === wallet_address.toLowerCase()) {
    //       return { isValid: true, message: null }
    //     }
    //   } catch (e) {
    //     this.logger.warn('EOA verify failed:', e)
    //   }
    // }

    // try {
    //   const rpcUrl = this.configService.get<string>('RPC_URL')
    //   const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    //   const contract = new ethers.Contract(
    //     wallet_address,
    //     [
    //       'function isValidSignature(bytes32 _hash, bytes _signature) view returns (bytes4)',
    //     ],
    //     provider,
    //   )

    //   const result = await contract.isValidSignature(messageHash, sig)
    //   if (result && result.toLowerCase() === '0x1626ba7e') {
    //     return { isValid: true, message: null }
    //   }
    // } catch (err) {
    //   this.logger.error('EIP-1271 verification failed', err)
    // }

    return {
      isValid: false,
      message: 'Invalid signature format or verification failed',
    }
  }
}
