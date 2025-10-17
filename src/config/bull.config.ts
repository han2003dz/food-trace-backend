import { registerAs } from '@nestjs/config'

export default registerAs('bull', () => ({
  host: process.env.BULL_REDIS_HOST,
  port: parseInt(process.env.BULL_REDIS_PORT) || 6379,
}))
