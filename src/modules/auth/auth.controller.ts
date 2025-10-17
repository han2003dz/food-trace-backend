import { Controller, Post, Body, Get, Query } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignInDto } from './dto/sign-in.dto'
import { GetNonceDto } from './dto/get-nonce.dto'
import { Public } from '../../metadata/public.metadata'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('nonce')
  getNonce(@Query() getNonceDto: GetNonceDto) {
    return this.authService.getNonce(getNonceDto)
  }

  @Public()
  @Post('login')
  create(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto)
  }
}
