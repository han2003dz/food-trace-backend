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
import { User } from '../user/entities/user.entity'
import foodTraceArtifact from '../crawl/contracts/TraceabilityMerkleRegistry.json'
import { CreateBatchDto, EventDto } from './dto/create-batch.dto'
import { leafHash } from '@app/utils/hash'
import { buildMerkleRoot } from '@app/utils/merkle'
import { generateBatchCode } from '@app/utils/generate'

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name)
  private readonly contract: ethers.Contract
  private readonly wallet: ethers.Wallet

  constructor(
    @InjectRepository(BatchEntity)
    private readonly batchRepo: Repository<BatchEntity>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
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

    this.logger.log(
      `🔗 Initialized with committer wallet: ${this.wallet.address}`,
    )
  }

  /** Create or update an existing batch */
  async upsert(data: Partial<BatchEntity>): Promise<BatchEntity> {
    const existing = await this.batchRepo.findOne({
      where: { batch_code: data.batch_code },
    })

    if (existing) {
      Object.assign(existing, data)
      this.logger.debug(`Updated batch ${data.batch_code}`)
      return this.batchRepo.save(existing)
    }

    const newBatch = this.batchRepo.create(data)
    this.logger.debug(`Created new batch ${data.batch_code}`)
    return this.batchRepo.save(newBatch)
  }

  async updateByOnchainId(onchainId: number, updates: Partial<BatchEntity>) {
    const batch = await this.batchRepo.findOne({
      where: { onchain_batch_id: onchainId },
    })
    if (!batch) {
      this.logger.warn(`Batch with onchain ID ${onchainId} not found`)
      return null
    }

    Object.assign(batch, updates)
    return this.batchRepo.save(batch)
  }

  async findAll() {
    return this.batchRepo.find({
      order: { created_at: 'DESC' },
      relations: ['product'],
    })
  }

  /**
   * Create a batch:
   *  - validate product, events
   *  - hash leaves
   *  - compute Merkle root
   *  - commit to on-chain
   *  - save pending_sync to DB
   */
  async createBatchOnchain(dataDto: CreateBatchDto, user: User) {
    const { productId, fromEventId, toEventId, events } = dataDto

    if (fromEventId >= toEventId) {
      throw new BadRequestException(
        'Invalid event range: fromEventId must be < toEventId',
      )
    }
    if (!events?.length) throw new BadRequestException('events cannot be empty')

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['current_owner'],
    })
    if (!product) throw new NotFoundException('Product not found')

    const productLeaf = this.buildProductLeaf(product)
    const rangeEvents = events.filter(
      (e) => e.id >= fromEventId && e.id <= toEventId,
    )
    if (!rangeEvents.length)
      throw new BadRequestException('No events in given range')

    const eventLeaves = this.buildEventLeaves(rangeEvents)

    const merkleRoot = buildMerkleRoot([productLeaf, ...eventLeaves])

    const seq =
      (await this.batchRepo.count({ where: { product: { id: product.id } } })) +
      1
    const batchCode = generateBatchCode(product.name, product.origin ?? '', seq)

    const paused = await this.contract.paused().catch(() => false)
    if (paused) throw new BadRequestException('Contract currently paused')

    let tx
    try {
      tx = await this.contract.commitWithBatchCode(
        merkleRoot,
        fromEventId,
        toEventId,
        batchCode,
      )
      await tx.wait()
    } catch (err: any) {
      this.logger.error(`❌ Commit transaction failed: ${err.message}`)
      throw new BadRequestException(
        `Blockchain transaction reverted: ${err.reason || err.message}`,
      )
    }

    const entity = this.batchRepo.create({
      batch_code: batchCode,
      product,
      committer: this.wallet.address,
      status: 'pending_sync',
      metadata: {
        merkleRoot,
        fromEventId,
        toEventId,
        tx_hash: tx.hash,
        productLeaf,
        eventCount: eventLeaves.length,
        createdBy: user.wallet_address,
      },
    })
    const saved = await this.batchRepo.save(entity)

    this.logger.log(`✅ Created batch ${batchCode}, tx=${tx.hash}`)

    return {
      id: saved.id,
      batch_code: saved.batch_code,
      status: saved.status,
      tx_hash: tx.hash,
      merkleRoot,
    }
  }

  private buildProductLeaf(product: Product) {
    return leafHash({
      product_id: product.id,
      name: product.name,
      origin: product.origin,
      manufacture_date:
        product.manufacture_date?.toISOString?.() ?? product.manufacture_date,
      expiry_date: product.expiry_date?.toISOString?.() ?? product.expiry_date,
      owner_wallet:
        product.current_owner?.wallet_address ?? product.owner_wallet,
    })
  }

  private buildEventLeaves(events: EventDto[]) {
    return events.map((e) =>
      leafHash({
        id: e.id,
        name: e.name,
        data: e.data ?? null,
      }),
    )
  }
}
