import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ])

    if (!roles) {
      return false
    }

    const request = context.switchToHttp().getRequest()
    const userRole = request.user?.role

    return this.validateRoles(roles, userRole)
  }

  validateRoles(roles: string[], userRole: string): boolean {
    if (!userRole) {
      return false
    }
    return roles.includes(userRole)
  }
}
