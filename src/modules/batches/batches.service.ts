import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { ethers } from 'ethers'

import { BatchEntity } from './entities/batches.entity'
import { Product } from '../product/entities/product.entity'
import { Organizations } from '../organizations/entities/organizations.entity'
import { CreateBatchDto } from './dto/create-batch.dto'

import foodTraceArtifact from '../crawl/contracts/TraceabilityMerkleRegistry.json'
import { generateBatchCode } from '@app/utils/generate'
import { BatchEventEntity } from './entities/batch-event.entity'
import { User } from '../user/entities/user.entity'
import { BatchCodeEntity } from './entities/batch-code.entity'
import { randomUUID } from 'crypto'
import { hashJson } from '@app/utils/hash'
import {
  BatchDetailResponseDto,
  BatchTimelineItemDto,
} from './responses/batch-detail.response'

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name)
  private readonly contract: ethers.Contract
  private readonly wallet: ethers.Wallet

  constructor(
    @InjectRepository(BatchEntity)
    private readonly batchRepo: Repository<BatchEntity>,
    @InjectRepository(BatchEventEntity)
    private readonly batchEventRepo: Repository<BatchEventEntity>,
    @InjectRepository(BatchCodeEntity)
    private readonly batchCodeRepo: Repository<BatchCodeEntity>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Organizations)
    private readonly orgRepo: Repository<Organizations>,
    private readonly configService: ConfigService,
  ) {
    const rpc = this.configService.getOrThrow<string>('RPC_URL')
    const pk = this.configService.getOrThrow<string>('COMMITTER_PRIVATE_KEY')
    const contractAddress =
      this.configService.getOrThrow<string>('CONTRACT_ADDRESS')

    const provider = new ethers.providers.JsonRpcProvider(rpc)
    this.wallet = new ethers.Wallet(pk, provider)
    this.contract = new ethers.Contract(
      contractAddress,
      foodTraceArtifact.abi,
      this.wallet,
    )

    this.logger.log(`🔗 Connected to contract: ${contractAddress}`)
    this.logger.log(`👤 Using committer wallet: ${this.wallet.address}`)
  }

  /**
   * Create a new batch and sync with blockchain.
   * Steps:
   *  1️⃣ Validate product & organization
   *  2️⃣ Generate batch code
   *  3️⃣ Compute product leaf hash
   *  4️⃣ Call createBatch() on-chain
   *  5️⃣ Save local DB record with onchainBatchId & txHash
   */
  async createBatchOnchain(dto: CreateBatchDto, user: User) {
    const { product_id, creator_org_id, metadata_uri } = dto

    const product = await this.productRepo.findOne({
      where: { id: product_id },
      relations: ['organization'],
    })

    if (!product) throw new NotFoundException('Product not found')
    if (!product.onchain_product_id)
      throw new BadRequestException('Product is not yet registered on-chain')

    const creatorOrg = await this.orgRepo.findOne({
      where: { id: creator_org_id },
    })

    if (!creatorOrg)
      throw new NotFoundException('Creator organization not found')

    const seq =
      (await this.batchRepo.count({ where: { product: { id: product.id } } })) +
      1

    const batchCode = generateBatchCode(product.name, creatorOrg.name, seq)

    const initialDataRaw = {
      product_id,
      creator_org_id,
      created_at: new Date().toISOString(),
      nonce: randomUUID(),
      batch_code: batchCode,
    }

    const initial_data_hash = hashJson(initialDataRaw)

    const tx = await this.contract.createBatch(
      product.onchain_product_id,
      initial_data_hash,
    )

    this.logger.log(`⛓️ Sending createBatch TX: ${tx.hash}`)
    await tx.wait()

    const batch = this.batchRepo.create({
      product,
      creator_org: creatorOrg,
      current_owner: creatorOrg,
      creator_user: user,

      initial_data_hash,
      metadata_uri,
      status: 'HARVESTED',
      closed: false,

      metadata: {
        initial_data_raw: initialDataRaw,
      },

      tx_hash_pending: tx.hash,
    })

    const saved = await this.batchRepo.save(batch)
    return {
      id: saved.id,
      batch_code: batchCode,
      initial_data_hash,
      tx_hash: tx.hash,
    }
  }

  async recordTraceEvent(
    onchainBatchId: number,
    eventType: number,
    eventHash: string,
  ) {
    try {
      const tx = await this.contract.recordTraceEvent(
        onchainBatchId,
        eventType,
        eventHash,
      )
      await tx.wait()
      this.logger.log(`✅ Trace event recorded for batch ${onchainBatchId}`)
      return { txHash: tx.hash }
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to record trace event: ${err.reason || err.message}`,
      )
    }
  }

  /** 🔐 Commit Merkle root for batch audit */
  async commitMerkleRoot(onchainBatchId: number, root: string) {
    try {
      const tx = await this.contract.commitBatchMerkleRoot(onchainBatchId, root)
      await tx.wait()
      this.logger.log(`✅ Merkle root committed for batch ${onchainBatchId}`)
      return { txHash: tx.hash }
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to commit Merkle root: ${err.reason || err.message}`,
      )
    }
  }

  async findAll() {
    return this.batchRepo.find({
      relations: ['product', 'creator_org', 'current_owner'],
      order: { created_at: 'DESC' },
    })
  }

  async findByProduct(productId: string) {
    return this.batchRepo.find({
      where: { product: { id: productId } },
      relations: ['product', 'creator_org', 'current_owner'],
      order: { created_at: 'DESC' },
    })
  }

  async updateAfterOnchainSynced(params: {
    onchain_batch_id?: number
    tx_hash?: string
    block_number?: number
    metadata?: Record<string, any>
    status?: string
    synced?: boolean
  }): Promise<BatchEntity | null> {
    const {
      onchain_batch_id,
      tx_hash,
      block_number,
      metadata = {},
      status,
      synced = true,
    } = params

    let batch: BatchEntity | null = null

    if (onchain_batch_id) {
      batch = await this.batchRepo.findOne({
        where: { onchain_batch_id },
        relations: ['product', 'creator_org', 'current_owner'],
      })
    }

    if (!batch && tx_hash) {
      batch = await this.batchRepo.findOne({
        where: { tx_hash_pending: tx_hash },
        relations: ['product', 'creator_org', 'current_owner'],
      })
    }

    if (!batch) {
      this.logger.warn(
        `⚠️ updateAfterOnchainSynced() → No local batch matches (onchain_id=${onchain_batch_id}, tx=${tx_hash})`,
      )
      return null
    }

    if (onchain_batch_id && !batch.onchain_batch_id) {
      batch.onchain_batch_id = onchain_batch_id
    }

    batch.metadata = {
      ...(batch.metadata || {}),
      ...(metadata || {}),
    }

    if (status) {
      batch.status = status
    }

    batch.onchain_synced = synced

    if (tx_hash) {
      batch.tx_hash_pending = null
    }

    if (block_number) {
      batch.metadata = {
        ...batch.metadata,
        last_block_number: block_number,
      }
    }

    const saved = await this.batchRepo.save(batch)

    this.logger.log(
      `🔄 Batch synced: local_id=${batch.id}, onchain_id=${batch.onchain_batch_id}`,
    )

    return saved
  }

  async appendTraceEvent(
    onchainBatchId: number,
    eventData: {
      event_type: string
      actor_wallet: string
      data_hash: string
      tx_hash: string
      block_number: number
    },
  ) {
    const batch = await this.batchRepo.findOne({
      where: { onchain_batch_id: onchainBatchId },
    })

    if (!batch) {
      this.logger.warn(
        `⚠️ Cannot append event — batch ${onchainBatchId} not found`,
      )
      return null
    }

    const newEvent = this.batchEventRepo.create({
      batch,
      event_type: eventData.event_type,
      data_hash: eventData.data_hash,
      tx_hash: eventData.tx_hash,
      block_number: eventData.block_number,
      actor_org: batch.creator_org || null,
    })

    await this.batchEventRepo.save(newEvent)
    this.logger.log(`📍 Added trace event to batch ${onchainBatchId}`)
    return newEvent
  }

  async findByOnchainId(onchainId: number): Promise<BatchEntity | null> {
    return this.batchRepo.findOne({
      where: { onchain_batch_id: onchainId },
      relations: ['product', 'creator_org', 'current_owner'],
    })
  }

  async saveBatchCode(params: {
    batch: BatchEntity
    batch_code: string
    batch_code_hash: string
  }) {
    const { batch, batch_code, batch_code_hash } = params

    const entity = this.batchCodeRepo.create({
      batch,
      batch_code,
      batch_code_hash,
    })

    return this.batchCodeRepo.save(entity)
  }

  async getBatchByUser(user: User) {
    return this.batchRepo.find({
      where: [
        { creator_user: { id: user.id } },
        { current_owner: { id: user.organization?.id } },
      ],
      relations: [
        'product',
        'creator_org',
        'current_owner',
        'code',
        'merkle_root',
      ],
      order: { created_at: 'DESC' },
    })
  }

  async getBatchDetail(id: string): Promise<BatchDetailResponseDto> {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: [
        'product',
        'creator_org',
        'current_owner',
        'code',
        'merkle_root',
        'events',
        'events.actor_org',
      ],
      order: {
        events: {
          created_at: 'ASC',
        },
      },
    })

    if (!batch) throw new NotFoundException('Batch not found')

    const timeline = this.buildTimeline(batch)
    return {
      id: batch.id,
      batch_code: batch.code?.batch_code ?? null,
      status: batch.status,
      closed: batch.closed,
      onchain_batch_id: batch.onchain_batch_id ?? null,
      onchain_synced: batch.onchain_synced,

      initial_data_hash: batch.initial_data_hash,
      metadata_uri: batch.metadata_uri ?? null,

      product: {
        id: batch.product.id,
        name: batch.product.name,
        category: batch.product.category ?? null,
        origin: (batch.product as any).origin ?? null,
        producer_name: (batch.product as any).producer_name ?? null,
        image_url: batch.product.image_url ?? null,
      },

      creator_org: batch.creator_org
        ? {
            id: batch.creator_org.id,
            name: batch.creator_org.name,
          }
        : null,

      current_owner: batch.current_owner
        ? {
            id: batch.current_owner.id,
            name: batch.current_owner.name,
          }
        : null,

      code: batch.code
        ? {
            batch_code: batch.code.batch_code,
            batch_code_hash: batch.code.batch_code_hash,
            qr_image_url: batch.code.qr_image_url ?? null,
          }
        : null,

      merkle_root: batch.merkle_root
        ? {
            root_hash: batch.merkle_root.root_hash,
            tx_hash: batch.merkle_root.tx_hash ?? null,
            block_number: batch.merkle_root.block_number ?? null,
            created_at: batch.merkle_root.created_at.toISOString(),
          }
        : null,

      timeline,

      created_at: batch.created_at.toISOString(),
      updated_at: batch.updated_at.toISOString(),
    }
  }

  private buildTimeline(batch: BatchEntity): BatchTimelineItemDto[] {
    if (!batch.events.length) return []

    const labelMap: Record<string, string> = {
      CREATED: 'Batch created',
      PROCESSED: 'Processed',
      SHIPPED: 'Shipped',
      RECEIVED: 'Received',
      STORED: 'Stored in warehouse',
      SOLD: 'Sold to customer',
      RECALLED: 'Recalled from market',
    }

    return batch.events
      .slice()
      .sort((a, b) => {
        const ta = a.timestamp ?? a.created_at
        const tb = b.timestamp ?? b.created_at

        return ta.getTime() - tb.getTime()
      })
      .map((e) => ({
        id: e.id,
        event_type: e.event_type,
        label: labelMap[e.event_type] ?? e.event_type,
        at: (e.timestamp ?? e.created_at).toISOString(),
        actor_org_name: e.actor_org?.name ?? null,
        tx_hash: e.tx_hash ?? null,
      }))
  }
}
