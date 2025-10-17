import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Job } from 'bullmq'
import { Cacheable } from 'cacheable'
import { CACHE_INSTANCE } from './../../../common/constant/provider.constant'
import { Web3Service } from './../../crawl/services/web3.service'
import { UserService } from './../../user/user.service'
import { BLOCK_KEY } from '../../../common/constant/bull-queue.constant'

@Processor('crawl')
export class CrawlProcessor extends WorkerHost {
  constructor(
    @Inject(CACHE_INSTANCE) private cacheable: Cacheable,
    private readonly configService: ConfigService,
    private readonly web3Service: Web3Service,
    private readonly userService: UserService,
  ) {
    super()
  }
  private readonly logger = new Logger(CrawlProcessor.name)

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'crawl':
        try {
          const data = await this.web3Service.getEventLogs(
            job.data.fromBlockNumber,
            job.data.toBlockNumber,
            job.data.event,
          )
          if (!data.length) {
            this.logger.warn(
              `No events found for block range ${job.data.fromBlockNumber} to ${job.data.toBlockNumber}`,
            )
          } else {
            // await this.userService.updateUsersData(data)
          }

          const blockKey = BLOCK_KEY
          await this.cacheable.set(blockKey, job.data.toBlockNumber + 1)
        } catch (error) {
          throw error
        }
        break

      default:
        this.logger.warn(`Unknown job type: ${job.name}`)
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job<any, any, string>) {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}`,
    )
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any, any, string>) {
    this.logger.debug(
      `Job ${job.id} of type ${job.name} completed successfully with data ${JSON.stringify(job.data)}`,
    )
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any, any, string>) {
    this.logger.error(
      `Job ${job.id} of type ${job.name} failed with data ${JSON.stringify(job.data)}`,
    )
  }
}
