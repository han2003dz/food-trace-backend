import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { Web3Service } from './../../crawl/services/web3.service'
import { EventParserService } from '@app/modules/crawl/services/event-parser.service'
import { OnchainEventService } from '@app/modules/onchain-events/onchain-events.service'
import { ParsedEvent } from '@app/modules/crawl/types/parsed-event.type'
import { BatchesService } from '@app/modules/batches/batches.service'

@Processor('crawl')
export class CrawlProcessor extends WorkerHost {
  constructor(
    private readonly web3Service: Web3Service,
    private readonly parser: EventParserService,
    private readonly onchainEventService: OnchainEventService,
    private readonly batchesService: BatchesService,
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

    const parsedEvents: ParsedEvent[] = logs
      .map((log) => this.parser.parse(log))
      .filter((e) => !!e)

    if (!parsedEvents.length) {
      this.logger.warn(
        `No valid parsed events in blocks ${fromBlockNumber} → ${toBlockNumber}`,
      )
      return
    }

    for (const event of parsedEvents) {
      console.log('event', event)
      try {
        switch (event.event_name) {
          case 'BatchCodeBound':
            await this.handleBatchCodeBound(event)
            break

          case 'RootCommitted':
            await this.handleRootCommitted(event)
            break

          case 'CommitterChanged':
            await this.handleCommitterChanged(event)
            break

          default:
            this.logger.debug(`Unhandled event type: ${event.event_name}`)
            break
        }
        await this.onchainEventService.saveEvents([event])
      } catch (error) {
        this.logger.error(
          `Error processing event ${event.event_name}: ${error.message}`,
          error.stack,
        )
      }
    }
  }

  private async handleBatchCodeBound(event: ParsedEvent) {
    const { args, tx_hash, block_number } = event

    const batchCode = args?.batchCode
    const batchId = Number(args?.batchId)
    const batchCodeHash = args?.batchCodeHash

    if (!batchCode) {
      this.logger.warn(`Missing batchCode in event ${tx_hash}`)
      return
    }

    await this.batchesService.upsert({
      batch_code: batchCode,
      batch_code_hash: batchCodeHash,
      onchain_batch_id: batchId,
      committer: event.args.committer || null,
      status: 'verified',
      metadata: {
        tx_hash,
        block_number,
      },
    })
  }

  private async handleRootCommitted(event: ParsedEvent) {
    const { args, tx_hash } = event
    const batchId = args.batchId.toString()
    const root = args.merkleRoot

    if (!batchId || !root) {
      this.logger.warn(`RootCommitted missing batchId or root (tx: ${tx_hash})`)
      return
    }

    await this.batchesService.updateByOnchainId(Number(batchId), {
      metadata: { merkleRoot: root, tx_hash },
    })

    this.logger.log(` Updated batch ${batchId} with new root`)
  }

  private async handleCommitterChanged(event: ParsedEvent) {
    const { args } = event
    const oldCommitter = args.oldCommitter
    const newCommitter = args.newCommitter

    this.logger.log(`Committer changed: ${oldCommitter} → ${newCommitter}`)
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
