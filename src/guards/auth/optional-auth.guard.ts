import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { UserService } from './../../modules/user/user.service'

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private logger = new Logger(OptionalAuthGuard.name)

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const authHeader = request.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const payload = await this.jwtService.verifyAsync(token)
        const user = await this.userService.findOne(payload.sub)
        if (user) {
          request.user = user
        }
      } catch (err) {
        this.logger.warn('Invalid JWT, proceeding as guest', err)
      }
    }
    return true
  }
}
