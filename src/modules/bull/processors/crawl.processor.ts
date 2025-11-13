import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { Web3Service } from './../../crawl/services/web3.service'
import { EventParserService } from '@app/modules/crawl/services/event-parser.service'
import { OnchainEventService } from '@app/modules/onchain-events/onchain-events.service'
import { ParsedEvent } from '@app/modules/crawl/types/parsed-event.type'
import { BatchesService } from '@app/modules/batches/batches.service'
import { ProductService } from '@app/modules/product/product.service'

@Processor('crawl')
export class CrawlProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlProcessor.name)

  constructor(
    private readonly web3Service: Web3Service,
    private readonly parser: EventParserService,
    private readonly onchainEventService: OnchainEventService,
    private readonly batchesService: BatchesService,
    private readonly productService: ProductService,
  ) {
    super()
  }

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
      try {
        switch (event.event_name) {
          case 'ProductCreated':
            await this.handleProductCreated(event)
            break

          case 'BatchCodeBound':
            await this.handleBatchCodeBound(event)
            break

          case 'BatchCreated':
            await this.handleBatchCreated(event)
            break

          case 'TraceEventRecorded':
            await this.handleTraceEventRecorded(event)
            break

          case 'BatchMerkleRootCommitted':
            await this.handleBatchMerkleRootCommitted(event)
            break

          default:
            this.logger.debug(`Unhandled event type: ${event.event_name}`)
            break
        }

        await this.onchainEventService.saveEvents([event])
      } catch (error) {
        this.logger.error(
          `Error processing ${event.event_name}: ${error.message}`,
          error.stack,
        )
      }
    }
  }

  /**
   * 🔹 ProductCreated(productId, creator, name, metadataURI)
   */
  private async handleProductCreated(event: ParsedEvent) {
    const { args, tx_hash } = event

    console.log('tx_hash', tx_hash)

    const productId = Number(args?.productId)
    const metadataURI = args?.metadataURI
    const name = args?.name

    if (!productId || !name) {
      this.logger.warn(`Invalid ProductCreated event in tx ${tx_hash}`)
      return
    }

    this.logger.log(
      `🪴 ProductCreated event → productId=${productId}, name=${name}`,
    )

    await this.productService.updateByTxHashPending(tx_hash, {
      onchain_product_id: productId,
      metadata_uri: metadataURI,
      onchain_synced: true,
    })
  }

  /**
   * 🔹 BatchCreated(batchId, productId, creator, metadataURI, dataHash)
   */
  private async handleBatchCreated(event: ParsedEvent) {
    const { args, tx_hash } = event

    const onchainBatchId = Number(args.batchId)

    await this.batchesService.updateAfterOnchainSynced({
      tx_hash,
      onchain_batch_id: onchainBatchId,
    })
  }

  /**
   * 🔹 TraceEventRecorded(batchId, eventType, dataHash, actor, timestamp)
   */
  private async handleTraceEventRecorded(event: ParsedEvent) {
    const { args, tx_hash, block_number } = event
    const batchId = Number(args?.batchId)
    const eventType = Number(args?.eventType)
    const actor = args?.actor
    const dataHash = args?.dataHash

    if (!batchId) {
      this.logger.warn(`TraceEventRecorded missing batchId (tx: ${tx_hash})`)
      return
    }

    this.logger.log(
      `📍 TraceEventRecorded → batchId=${batchId}, type=${eventType}, actor=${actor}`,
    )

    await this.batchesService.appendTraceEvent?.(batchId, {
      event_type: eventType.toString(),
      actor_wallet: actor,
      data_hash: dataHash,
      tx_hash,
      block_number,
    })
  }

  /**
   * 🔹 BatchMerkleRootCommitted(batchId, root, committer, timestamp)
   */
  private async handleBatchMerkleRootCommitted(event: ParsedEvent) {
    const { args, tx_hash } = event
    const batchId = Number(args?.batchId)
    const root = args?.root

    if (!batchId || !root) {
      this.logger.warn(
        `Invalid BatchMerkleRootCommitted event (tx: ${tx_hash})`,
      )
      return
    }

    this.logger.log(
      `🔐 BatchMerkleRootCommitted → batchId=${batchId}, root=${root}`,
    )

    await this.batchesService.updateAfterOnchainSynced({
      onchain_batch_id: batchId,
      metadata: {
        merkle_root: root,
        merkle_root_tx_hash: tx_hash,
        updated_at: new Date().toISOString(),
      },
    })
  }

  private async handleBatchCodeBound(event: ParsedEvent) {
    const { args, tx_hash, block_number } = event

    const batchId = Number(args?.batchId)
    const batchCode = args?.batchCode
    const batchCodeHash = args?.batchCodeHash
    const committer = args?.committer ?? null

    if (!batchId || !batchCode || !batchCodeHash) {
      this.logger.warn(
        `⚠️ Invalid BatchCodeBound event (tx: ${tx_hash}): missing args`,
      )
      return
    }

    this.logger.log(
      `🔗 BatchCodeBound → batchId=${batchId}, code=${batchCode}, hash=${batchCodeHash}`,
    )

    const batch = await this.batchesService.findByOnchainId(batchId)
    if (!batch) {
      this.logger.warn(
        `⚠️ No local batch matches onchain_batch_id=${batchId} (tx: ${tx_hash})`,
      )
      return
    }

    await this.batchesService.saveBatchCode({
      batch,
      batch_code: batchCode,
      batch_code_hash: batchCodeHash,
    })

    await this.batchesService.updateAfterOnchainSynced({
      onchain_batch_id: batchId,
      metadata: {
        batch_code: batchCode,
        batch_code_hash: batchCodeHash,
        batch_code_tx_hash: tx_hash,
        batch_code_block_number: block_number,
        committer,
      },
    })

    this.logger.log(
      `✅ BatchCodeBound synced locally for batchId=${batchId} (tx=${tx_hash})`,
    )
  }

  // Worker events
  @OnWorkerEvent('active')
  onActive(job: Job<any, any, string>) {
    this.logger.debug(
      `Processing job ${job.id} (${job.name}) with data ${JSON.stringify(job.data)}`,
    )
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any, any, string>) {
    this.logger.debug(`Job ${job.id} (${job.name}) completed successfully`)
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any, any, string>) {
    this.logger.error(`Job ${job.id} (${job.name}) failed`, job.data)
  }
}
