import { Controller, Get, Req } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { UserService } from './user.service'
import { Request } from 'express'

@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  getMe(@Req() req: Request) {
    return this.userService.getMyProfile(req.user)
  }
}
