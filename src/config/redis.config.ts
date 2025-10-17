import { registerAs } from '@nestjs/config'

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT) || 6379,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  ttl: undefined,
}))
