import { AuthGuard } from '@app/guards/auth/auth.guard'
import { applyDecorators, UseGuards } from '@nestjs/common'

export function Auth() {
  return applyDecorators(UseGuards(AuthGuard))
}
