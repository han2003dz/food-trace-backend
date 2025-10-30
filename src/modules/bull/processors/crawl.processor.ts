import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { Web3Service } from './../../crawl/services/web3.service'
import { EventParserService } from '@app/modules/crawl/services/event-parser.service'
import { OnchainEventService } from '@app/modules/onchain-events/onchain-events.service'

@Processor('crawl')
export class CrawlProcessor extends WorkerHost {
  constructor(
    private readonly web3Service: Web3Service,
    private readonly parser: EventParserService,
    private readonly onchainEventService: OnchainEventService,
  ) {
    super()
  }
  private readonly logger = new Logger(CrawlProcessor.name)

  async process(job: Job<any, any, string>): Promise<void> {
    const { fromBlockNumber, toBlockNumber, event } = job.data

    const logs = await this.web3Service.getEventLogs(
      fromBlockNumber,
      toBlockNumber,
      event,
    )
    if (!logs.length) {
      this.logger.warn(
        `[${event}] No logs between ${fromBlockNumber} → ${toBlockNumber}`,
      )
      return
    }

    const parsedEvents = logs
      .map((log) => this.parser.parse(log))
      .filter((e) => !!e)
      .map((p) => ({
        event_name: p.event_name,
        args: p.args,
        tx_hash: p.tx_hash,
        block_number: p.block_number,
        contract_address: p.contract_address,
      }))

    await this.onchainEventService.saveEvents(parsedEvents)
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
