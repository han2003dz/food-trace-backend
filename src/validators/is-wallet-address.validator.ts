import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'
import { ethers } from 'ethers'

export function IsWalletAddress(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isWalletAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          try {
            return ethers.utils.isAddress(value)
          } catch {
            return false
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} invalid`
        },
      },
    })
  }
}
