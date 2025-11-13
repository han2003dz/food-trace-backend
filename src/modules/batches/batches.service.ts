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
    const { product_id, creator_org_id, initial_data_hash, metadata_uri } = dto

    // 1️⃣ Validate product
    const product = await this.productRepo.findOne({
      where: { id: product_id },
      relations: ['organization'],
    })
    if (!product) throw new NotFoundException('Product not found')

    if (!product.onchain_product_id)
      throw new BadRequestException(
        'Product has not been synced on-chain. Cannot create batch.',
      )

    // 2️⃣ Validate creator organization
    const creatorOrg = await this.orgRepo.findOne({
      where: { id: creator_org_id },
    })
    if (!creatorOrg)
      throw new NotFoundException('Creator organization not found')

    // 3️⃣ Auto-generate batch code
    const seq =
      (await this.batchRepo.count({
        where: { product: { id: product.id } },
      })) + 1

    const batchCode = generateBatchCode(
      product.name,
      creatorOrg.name || 'ORG',
      seq,
    )

    // 4️⃣ Check contract pause state
    const paused = await this.contract.paused().catch(() => false)
    if (paused) throw new BadRequestException('Contract is paused')

    // 5️⃣ Send on-chain TX (without waiting for event)
    let tx
    try {
      tx = await this.contract.createBatch(
        product.onchain_product_id,
        initial_data_hash,
        metadata_uri || '',
      )

      this.logger.log(`⛓️ Sent createBatch TX: ${tx.hash}`)
    } catch (err: any) {
      this.logger.error(`❌ On-chain TX failed: ${err.message}`)
      throw new BadRequestException(
        `Blockchain transaction failed: ${err.reason || err.message}`,
      )
    }

    // 6️⃣ Save batch off-chain (pending sync)
    const batch = this.batchRepo.create({
      product,
      creator_org: creatorOrg,
      current_owner: creatorOrg,

      initial_data_hash,
      metadata_uri: metadata_uri || null,

      status: 'HARVESTED',
      closed: false,

      tx_hash_pending: tx.hash,
      onchain_synced: false,

      metadata: {
        generated_batch_code: batchCode,
        createdBy: user.wallet_address,
      },
    })

    const savedBatch = await this.batchRepo.save(batch)

    // 7️⃣ Save batch code entity
    const codeEntity = this.batchCodeRepo.create({
      batch: savedBatch,
      batch_code: batchCode,
      batch_code_hash: ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(batchCode),
      ),
    })

    await this.batchCodeRepo.save(codeEntity)

    this.logger.log(
      `✅ Batch created locally: ${batchCode}, waiting on-chain sync...`,
    )

    return {
      id: savedBatch.id,
      batch_code: batchCode,
      tx_hash_pending: tx.hash,
      onchain_batch_id: null,
      status: savedBatch.status,
    }
  }

  /** 🧾 Record a new trace event for a batch */
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
    tx_hash?: string
    onchain_batch_id?: number
    metadata?: Record<string, any>
  }): Promise<BatchEntity | null> {
    const { tx_hash, onchain_batch_id, metadata } = params

    let batch: BatchEntity | null = null

    // 🔍 1. Trường hợp tạo batch — tìm theo tx_hash_pending
    if (tx_hash) {
      batch = await this.batchRepo.findOne({
        where: { tx_hash_pending: tx_hash },
        relations: ['product', 'creator_org', 'current_owner'],
      })

      if (!batch) {
        this.logger.warn(`⚠️ No batch found with tx_hash_pending=${tx_hash}`)
        return null
      }

      if (onchain_batch_id) {
        batch.onchain_batch_id = onchain_batch_id
        batch.onchain_synced = true
        batch.tx_hash_pending = null
      }
    }

    // 🔍 2. Trường hợp update merkle root / trace events — tìm theo onchain_batch_id
    else if (onchain_batch_id) {
      batch = await this.batchRepo.findOne({
        where: { onchain_batch_id },
      })

      if (!batch) {
        this.logger.warn(
          `⚠️ No batch found with onchain_batch_id=${onchain_batch_id}`,
        )
        return null
      }
    }

    if (!batch) return null

    // 🔄 3. Merge metadata (không ghi đè)
    if (metadata) {
      batch.metadata = {
        ...(batch.metadata || {}),
        ...metadata,
      }
    }

    const saved = await this.batchRepo.save(batch)

    this.logger.log(
      `🔄 Batch updated (local id=${saved.id}, onchain_batch_id=${saved.onchain_batch_id})`,
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
}
