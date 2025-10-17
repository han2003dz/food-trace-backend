import { Injectable, Logger, Scope } from '@nestjs/common'

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends Logger {
  constructor(context?: string) {
    super(context)
  }

  setContext(context: string) {
    this.context = context
  }

  log(message: unknown, context?: unknown): void {
    super.log(message, context || this.context)
  }

  warn(message: unknown, context?: unknown): void {
    super.warn(message, context || this.context)
  }

  error(message: unknown, stack?: unknown, context?: unknown): void {
    super.error(message, context || this.context)
  }

  debug(message: unknown, context?: unknown): void {
    super.debug(message, context || this.context)
  }
}
