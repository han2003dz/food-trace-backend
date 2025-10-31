// import { QUEUE } from '@app/common/constant/bull-queue.constant'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'
import { ConfigModule } from '@nestjs/config'
import config from 'config'
import configEnv from '../../config/default.config'
import { CacheModule } from '../cache/cache.module'
import { CrawlProducer } from './producers/crawl.producer'
import { CrawlModule } from '../crawl/crawl.module'
import { CrawlProcessor } from './processors/crawl.processor'
import { ScheduleModule } from '@nestjs/schedule'
import redisConfig from '../../config/redis.config'
import { DatabaseModule } from './../../database/database.module'
import { OnchainEventModule } from '../onchain-events/onchain-events.module'
import { EventParserService } from '../crawl/services/event-parser.service'
import { BatchesModule } from '../batches/batches.module'
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config.util.toObject(), configEnv, redisConfig],
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.BULL_REDIS_HOST || '127.0.0.1',
        port: Number(process.env.BULL_REDIS_PORT) || 6379,
        slotsRefreshTimeout: 3000,
      },
    }),
    BullModule.registerQueue({
      name: 'crawl',
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    LoggerModule,
    DatabaseModule,
    CacheModule,
    CrawlModule,
    OnchainEventModule,
    BatchesModule,
  ],
  providers: [CrawlProducer, CrawlProcessor, EventParserService],
})
export class BullQueueModule {}
