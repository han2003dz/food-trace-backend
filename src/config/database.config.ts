import { registerAs } from '@nestjs/config'
import { dataSourceOptions } from './../database/database'

export default registerAs('database', () => ({
  ...dataSourceOptions,
}))
