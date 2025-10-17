import { Controller } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { UserService } from './user.service'

@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
