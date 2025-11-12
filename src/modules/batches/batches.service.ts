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
  async createBatchOnchain(dataDto: CreateBatchDto) {
    const { product_id, creator_org_id, initial_data_hash, metadata_uri } =
      dataDto

    // 🧩 Validate product
    const product = await this.productRepo.findOne({
      where: { id: product_id },
      relations: ['organization'],
    })
    if (!product) throw new NotFoundException('Product not found')

    // 🧩 Validate organization (creator)
    const creatorOrg = await this.orgRepo.findOne({
      where: { id: creator_org_id },
    })
    if (!creatorOrg)
      throw new NotFoundException('Creator organization not found')

    // ✅ Auto-generate batch code
    const seq =
      (await this.batchRepo.count({ where: { product: { id: product.id } } })) +
      1
    const batchCode = generateBatchCode(
      product.name,
      creatorOrg.name || 'ORG',
      seq,
    )

    // ✅ Check contract paused state
    const paused = await this.contract.paused().catch(() => false)
    if (paused) throw new BadRequestException('Contract is paused')

    // ✅ Send on-chain transaction
    let tx, onchainBatchId
    try {
      tx = await this.contract.createBatch(
        product.onchain_product_id,
        initial_data_hash,
        metadata_uri || '',
      )
      this.logger.log(`⛓️ Sending createBatch TX: ${tx.hash}`)

      const receipt = await tx.wait()

      const event = receipt.logs
        .map((log) => {
          try {
            return this.contract.interface.parseLog(log)
          } catch {
            return null
          }
        })
        .find((e) => e && e.name === 'BatchCreated')

      onchainBatchId = event?.args?.batchId?.toString() ?? null
      if (!onchainBatchId)
        this.logger.warn('⚠️ BatchCreated event not found in receipt')
    } catch (err: any) {
      this.logger.error(`❌ On-chain batch creation failed: ${err.message}`)
      throw new BadRequestException(
        `Blockchain transaction failed: ${err.reason || err.message}`,
      )
    }

    // ✅ Save in local DB
    const batch = this.batchRepo.create({
      product,
      creator_org: creatorOrg,
      current_owner: creatorOrg,
      onchain_batch_id: onchainBatchId ? Number(onchainBatchId) : null,
      initial_data_hash,
      metadata_uri,
      status: 'HARVESTED',
      closed: false,
    })

    const saved = await this.batchRepo.save(batch)

    this.logger.log(
      `✅ Batch created successfully: ${batchCode}, onchainId=${onchainBatchId}`,
    )

    return {
      id: saved.id,
      batch_code: batchCode,
      onchain_batch_id: onchainBatchId,
      tx_hash: tx.hash,
      status: saved.status,
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

  async updateByOnchainId(
    onchainId: number,
    updates: Partial<BatchEntity>,
  ): Promise<BatchEntity | null> {
    const batch = await this.batchRepo.findOne({
      where: { onchain_batch_id: onchainId },
      relations: ['product'],
    })

    if (!batch) {
      this.logger.warn(`⚠️ Batch with onchainId ${onchainId} not found.`)
      return null
    }

    Object.assign(batch, updates)
    const saved = await this.batchRepo.save(batch)

    this.logger.log(`✅ Updated batch (onchainId=${onchainId})`)
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
}
