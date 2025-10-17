import { Global, Module } from '@nestjs/common'
import { Cacheable } from 'cacheable'
import { createKeyv } from '@keyv/redis'
import { ConfigType } from '@nestjs/config'
import redisConfig from '../../config/redis.config'
import { CACHE_INSTANCE } from './../../common/constant/provider.constant'

@Global()
@Module({
  providers: [
    {
      inject: [redisConfig.KEY],
      provide: CACHE_INSTANCE,
      useFactory: async (configuration: ConfigType<typeof redisConfig>) => {
        const redisUrl =
          configuration.username && configuration.password
            ? `redis://${configuration.username}:${configuration.password}@${configuration.host}:${configuration.port}`
            : `redis://${configuration.host}:${configuration.port}`
        const secondary = createKeyv(redisUrl)
        return new Cacheable({ secondary, ttl: configuration.ttl })
      },
    },
  ],
  exports: [CACHE_INSTANCE],
})
export class CacheModule {}
