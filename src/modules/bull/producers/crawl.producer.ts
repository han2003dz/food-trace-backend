import { Inject, Injectable, Logger } from '@nestjs/common'
import { Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { ConfigService } from '@nestjs/config'
import { Cacheable } from 'cacheable'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CACHE_INSTANCE } from './../../../common/constant/provider.constant'
import { Web3Service } from './../../crawl/services/web3.service'
import { BLOCK_KEY } from '../../../common/constant/bull-queue.constant'
import { CRAWL_EVENT } from './../../../common/constant/bull-queue.constant'

@Injectable()
export class CrawlProducer {
  constructor(
    @InjectQueue('crawl') private crawlQueue: Queue,
    @Inject(CACHE_INSTANCE) private cacheable: Cacheable,
    private readonly configService: ConfigService,
    private readonly web3Service: Web3Service,
  ) {}
  private readonly logger = new Logger(CrawlProducer.name)

  @Cron(CronExpression.EVERY_10_SECONDS)
  async addCrawlJob() {
    try {
      const blockKey = BLOCK_KEY
      const blockPerTime = this.configService.get<number>(
        'config.rpcLimitTestnet',
        5,
      )
      const [cachedBlock, latestBlock] = await Promise.all([
        this.cacheable.get<number>(blockKey),
        this.web3Service.getLatestBlockNumber(),
      ])

      const fromBlockNumber =
        cachedBlock ??
        this.configService.get<number>('config.defaultBlockNumber')
      const toBlockNumber = Math.min(
        fromBlockNumber + blockPerTime - 1,
        latestBlock,
      )

      for (const event of CRAWL_EVENT) {
        await this.crawlQueue.add('crawl', {
          fromBlockNumber,
          toBlockNumber,
          event,
        })
      }

      await this.cacheable.set(blockKey, toBlockNumber + 1)
    } catch (err) {
      this.logger.error('Error scheduling crawl job:', err)
    }
  }
}
