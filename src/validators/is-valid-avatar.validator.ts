import { UserParameter } from '../common/constant/user.constant'
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'

export function IsValidAvatar(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidAvatar',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            Array.isArray(value) &&
            value.every(
              (item) =>
                typeof item === 'object' &&
                typeof item.id === 'string' &&
                Object.values(UserParameter)
                  .filter((value) => typeof value === 'number')
                  .includes(item.parameter),
            )
          )
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an array of valid avatars`
        },
      },
    })
  }
}
