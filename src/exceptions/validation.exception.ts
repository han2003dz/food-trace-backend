import { HttpException, HttpStatus } from '@nestjs/common'

export class ValidationException extends HttpException {
  constructor(messages: string[]) {
    super(messages, HttpStatus.UNPROCESSABLE_ENTITY)
  }
}
