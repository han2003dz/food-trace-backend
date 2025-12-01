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
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate'
import { applyFiltersAndSort } from '@app/common/helper/pagination.helper'
import { UpdateBatchStatusDto } from './dto/update-batch.dto'
import {
  BatchEventType,
  BatchStatus,
  EventTypeToOnchainIndex,
} from '@app/common/enums/batch.enum'
import { sha256 } from 'ethers/lib/utils'
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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    console.log('tx', tx)

    const batch = this.batchRepo.create({
      product,
      creator_org: creatorOrg,
      current_owner: creatorOrg,
      creator_user: user,

      initial_data_hash,
      metadata_uri,
      status: BatchStatus.HARVESTED,
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

  async findAll(query: PaginateQuery): Promise<Paginated<BatchEntity>> {
    const qb = this.batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.creator_org', 'creator_org')
      .leftJoinAndSelect('batch.current_owner', 'current_owner')

    applyFiltersAndSort(qb, query, 'batch')

    return paginate(query, qb, {
      sortableColumns: ['created_at', 'updated_at', 'status'],
      searchableColumns: ['id'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 50,
      defaultLimit: 10,
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
    status?: BatchStatus
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
      event_type: BatchEventType
      actor_wallet: string
      data_hash: string
      tx_hash: string
      block_number: number
    },
  ) {
    const batch = await this.batchRepo.findOne({
      where: { onchain_batch_id: onchainBatchId },
      relations: ['current_owner', 'creator_org'],
    })

    if (!batch) {
      this.logger.warn(
        `⚠ Cannot append event — batch ${onchainBatchId} not found`,
      )
      return null
    }

    const existing = await this.batchEventRepo.findOne({
      where: {
        batch: { id: batch.id },
        tx_hash: eventData.tx_hash,
        block_number: eventData.block_number,
        event_type: eventData.event_type,
      },
    })

    if (existing) {
      this.logger.log(
        `🔁 Skip duplicate event for batch ${onchainBatchId} (tx=${eventData.tx_hash})`,
      )
      return existing
    }

    const statusMap: Record<BatchEventType, BatchStatus> = {
      [BatchEventType.CREATED]: batch.status,
      [BatchEventType.PROCESSED]: BatchStatus.PROCESSED,
      [BatchEventType.SHIPPED]: BatchStatus.IN_TRANSIT,
      [BatchEventType.RECEIVED]: BatchStatus.WAREHOUSE,
      [BatchEventType.STORED]: BatchStatus.WAREHOUSE,
      [BatchEventType.SOLD]: BatchStatus.SOLD,
      [BatchEventType.RECALLED]: BatchStatus.RECALLED,
      [BatchEventType.CUSTOM]: batch.status,
    }

    const newStatus: BatchStatus =
      statusMap[eventData.event_type] ?? batch.status

    const newEvent = this.batchEventRepo.create({
      batch,
      event_type: eventData.event_type,
      data_hash: eventData.data_hash,
      tx_hash: eventData.tx_hash,
      block_number: eventData.block_number,
      actor_org: batch.current_owner || batch.creator_org || null,
    })

    await this.batchEventRepo.save(newEvent)

    const shouldChangeOwner = [
      BatchEventType.RECEIVED,
      BatchEventType.STORED,
      BatchEventType.SOLD,
      BatchEventType.RECALLED,
    ].includes(eventData.event_type)

    let updatedOwner = batch.current_owner

    if (shouldChangeOwner) {
      const actorOrg = await this.orgRepo.findOne({
        where: { wallet_address: eventData.actor_wallet },
      })

      if (actorOrg) {
        updatedOwner = actorOrg
      }
    }

    const newClosed =
      [BatchEventType.SOLD, BatchEventType.RECALLED].includes(
        eventData.event_type,
      ) || batch.closed

    const pending_receiver_wallet =
      eventData.event_type === BatchEventType.RECEIVED
        ? null
        : batch.pending_receiver_wallet

    await this.batchRepo.update(
      { id: batch.id },
      {
        status: newStatus,
        closed: newClosed,
        current_owner: updatedOwner,
        pending_receiver_wallet,
      },
    )

    this.logger.log(
      `📌 Added new trace event for batch ${onchainBatchId} (${eventData.event_type})`,
    )

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

  async getBatchDetail(
    id: string,
    user: User,
  ): Promise<BatchDetailResponseDto> {
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
        'transfers',
        'transfers.from_org',
        'transfers.to_org',
      ],
      order: {
        events: { created_at: 'ASC' },
        transfers: { created_at: 'ASC' },
      },
    })

    if (!batch) throw new NotFoundException('Batch not found')

    // Nếu không có user → newUser = null
    const newUser = user?.id
      ? await this.userRepo.findOne({
          where: { id: user.id },
          relations: ['organization'],
        })
      : null

    // Safe-check 100%
    const isOwner =
      !!newUser?.organization?.id &&
      !!batch?.current_owner?.id &&
      newUser.organization.id === batch.current_owner.id

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

      isOwner,

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

  async getIncomingBatchesForUser(user: User) {
    const fullUser = await this.userRepo.findOne({
      where: { id: user.id },
    })

    if (!fullUser) {
      throw new NotFoundException('User not found')
    }

    return this.batchRepo.find({
      where: {
        pending_receiver_wallet: user.wallet_address,
        closed: false,
      },
      relations: ['product', 'creator_org', 'current_owner', 'code'],
      order: { created_at: 'DESC' },
    })
  }

  async recordTraceEventAndTransferOwnership(
    id: string,
    dto: UpdateBatchStatusDto,
    user: User,
  ) {
    const { event_type, metadata_uri, receiver_wallet } = dto

    // 1. Fetch batch + user
    const [batch, fullUser] = await Promise.all([
      this.batchRepo.findOne({
        where: { id },
        relations: ['creator_org', 'current_owner', 'product'],
      }),
      this.userRepo.findOne({
        where: { id: user.id },
        relations: ['organization'],
      }),
    ])

    if (!batch) throw new NotFoundException('Batch not found')
    if (!fullUser || !fullUser.organization)
      throw new BadRequestException('User organization not found')

    if (!batch.onchain_batch_id)
      throw new BadRequestException('Batch not registered on-chain')

    if (batch.closed)
      throw new BadRequestException('Batch already closed (Sold/Recalled)')

    const userWallet = fullUser.wallet_address.toLowerCase()
    const needsReceiver = [BatchEventType.SHIPPED, BatchEventType.RECEIVED]

    // 2. Validate business logic
    if (event_type === BatchEventType.SHIPPED) {
      if (
        !batch.current_owner ||
        batch.current_owner.wallet_address.toLowerCase() !== userWallet
      ) {
        throw new BadRequestException('Only current owner can SHIP')
      }

      if (!receiver_wallet) {
        throw new BadRequestException('receiver_wallet is required for SHIPPED')
      }

      if (receiver_wallet.toLowerCase() === userWallet) {
        throw new BadRequestException('Cannot ship to yourself')
      }

      if (batch.pending_receiver_wallet) {
        throw new BadRequestException(
          'Batch already shipped and waiting RECEIVED',
        )
      }
    } else if (event_type === BatchEventType.RECEIVED) {
      if (!batch.pending_receiver_wallet)
        throw new BadRequestException('No pending receiver for this batch')

      if (batch.pending_receiver_wallet.toLowerCase() !== userWallet)
        throw new BadRequestException('You are not assigned receiver')
    } else {
      // All other events except SHIPPED + RECEIVED
      if (
        !batch.current_owner ||
        batch.current_owner.wallet_address.toLowerCase() !== userWallet
      ) {
        throw new BadRequestException('You are not the owner of this batch')
      }

      if (batch.pending_receiver_wallet) {
        throw new BadRequestException(
          'Batch is pending transfer. Only RECEIVED allowed',
        )
      }
    }

    // 3. Validate transition
    this.ensureStatusTransition(batch.status as BatchStatus, event_type)

    // 4. Prepare on-chain payload
    const ZERO_BYTES32 =
      '0x0000000000000000000000000000000000000000000000000000000000000000'

    const data_hash = metadata_uri
      ? sha256(Buffer.from(metadata_uri))
      : ZERO_BYTES32

    const onchainType = EventTypeToOnchainIndex[event_type]

    if (onchainType === undefined) {
      throw new BadRequestException(`Unsupported event_type: ${event_type}`)
    }

    // FIXED: SHIPPED + RECEIVED require receiver
    const receiver = needsReceiver.includes(event_type)
      ? receiver_wallet!
      : ethers.constants.AddressZero
    // Debug info
    console.log('====== DEBUG TRANSFER ======')
    console.log('Backend signer:', this.wallet.address)
    console.log('Batch ID:', batch.onchain_batch_id)
    console.log('Receiver:', receiver)
    console.log('Event type:', event_type)
    console.log('onchainType:', onchainType)
    console.log('Data hash:', data_hash)
    console.log('================================')
    console.log('Using contract at:', this.contract.address)

    const role = await this.contract.roles(receiver)
    console.log('Receiver role:', role.toString())
    // const info = await this.contract.getBatch(25)
    // console.log('info', info)
    // const [
    //   productId,
    //   creator,
    //   currentOwner,
    //   initialDataHash,
    //   exists,
    //   closed,
    //   pendingReceiver,
    // ] = await this.contract.getBatch(batch.onchain_batch_id)

    // console.log('===== ONCHAIN BATCH INFO =====')
    // console.log('Product ID:', productId.toString())
    // console.log('Creator:', creator)
    // console.log('Current Owner:', currentOwner)
    // console.log('Initial Data Hash:', initialDataHash)
    // console.log('Exists:', exists)
    // console.log('Closed:', closed)
    // console.log('Pending Receiver:', pendingReceiver)
    // console.log('================================')

    // 5. Call contract

    // const batch2 = await this.contract.getBatch(batch.onchain_batch_id)
    // console.log('On-chain batch:', batch2)

    let tx: ethers.ContractTransaction
    try {
      tx = await this.contract.recordTraceEvent(
        batch.onchain_batch_id,
        2,
        data_hash,
        '0x774ef30d3Bf1e32212f65b411dFa5bB8d9fe0373',
      )
      this.logger.log(`⛓ TX: ${tx.hash}`)
      await tx.wait()
    } catch (err: any) {
      this.logger.error(`❌ On-chain failed: ${err.message}`)
      throw new BadRequestException(
        `Blockchain error: ${err.reason || err.message}`,
      )
    }

    // 6. Update DB
    batch.tx_hash_pending = tx.hash

    if (event_type === BatchEventType.SHIPPED) {
      batch.pending_receiver_wallet = receiver_wallet
    }

    if (event_type === BatchEventType.RECEIVED) {
      // FIXED: owner = receiver's organization, not user
      batch.current_owner = fullUser.organization
      batch.pending_receiver_wallet = null
    }

    if (
      event_type === BatchEventType.SOLD ||
      event_type === BatchEventType.RECALLED
    ) {
      batch.closed = true
    }

    await this.batchRepo.save(batch)

    return {
      id: batch.id,
      event_type,
      tx_hash: tx.hash,
      status: 'PENDING_ONCHAIN',
    }
  }

  async transfer(id: number, dto: UpdateBatchStatusDto, user: User) {
    if (!user) {
      throw new BadRequestException('Unauthorized')
    }
    const receiver = dto.receiver_wallet
    try {
      this.logger.debug('======= TRANSFER DEBUG =======')
      this.logger.debug(`Signer: ${this.wallet.address}`)
      this.logger.debug(`Batch: ${26}`)
      this.logger.debug(`Receiver: ${receiver}`)

      const eventType = 2 // SHIPPED

      // Nếu bạn không có data hash FE → dùng dummy hash
      const dataHash = ethers.utils.formatBytes32String('')

      // ==== CALL HÀM ĐÚNG CỦA CONTRACT ====
      const tx = await this.contract.recordTraceEvent(
        BigInt(26),
        eventType,
        dataHash,
        receiver,
      )

      this.logger.debug(`TX Pending: ${tx.hash}`)
      const receipt = await tx.wait()

      this.logger.debug(`TX Confirmed: ${receipt.transactionHash}`)

      return {
        success: true,
        txHash: receipt.transactionHash,
      }
    } catch (err) {
      this.logger.error('❌ Transfer failed', err)
      throw err
    }
  }

  private buildTimeline(batch: BatchEntity): BatchTimelineItemDto[] {
    const labelMap: Record<string, string> = {
      CREATED: 'Batch created',
      PROCESSED: 'Processed',
      SHIPPED: 'Shipped',
      RECEIVED: 'Received',
      STORED: 'Stored',
      SOLD: 'Sold',
      TRANSFER: 'Transferred',
    }

    // On-chain events
    const onchainEvents = (batch.events ?? []).map((e) => ({
      id: `onchain-${e.id}`,
      event_type: e.event_type,
      label: labelMap[e.event_type] ?? e.event_type,
      at: (e.timestamp ?? e.created_at)?.toISOString(),
      actor_org_name: e.actor_org?.name ?? null,
      tx_hash: e.tx_hash ?? null,
      source: 'onchain',
    }))

    // Off-chain transfers
    const transfers = (batch.transfers ?? []).map((t) => ({
      id: `transfer-${t.id}`,
      event_type: 'TRANSFER',
      label: `${t.from_org?.name} → ${t.to_org?.name}`,
      at: t.created_at.toISOString(),
      actor_org_name: `${t.from_org?.name} → ${t.to_org?.name}`,
      tx_hash: null,
      note: t.note ?? null,
      source: 'transfer',
    }))

    return [...onchainEvents, ...transfers].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    )
  }

  private ensureStatusTransition(
    currentStatus: BatchStatus | string,
    nextEvent: BatchEventType,
  ) {
    const allowed: Record<BatchStatus | string, BatchEventType[]> = {
      [BatchStatus.HARVESTED]: [
        BatchEventType.PROCESSED,
        BatchEventType.SHIPPED,
        BatchEventType.RECALLED,
      ],
      [BatchStatus.PROCESSED]: [
        BatchEventType.SHIPPED,
        BatchEventType.RECALLED,
      ],
      [BatchStatus.IN_TRANSIT]: [
        BatchEventType.RECEIVED,
        BatchEventType.RECALLED,
      ],
      [BatchStatus.WAREHOUSE]: [
        BatchEventType.STORED,
        BatchEventType.SOLD,
        BatchEventType.RECALLED,
      ],
      [BatchStatus.SOLD]: [],
      [BatchStatus.RECALLED]: [],
    }

    const allow = allowed[currentStatus]

    if (!allow) {
      this.logger.warn(`Unknown batch status: ${currentStatus}`)
      throw new BadRequestException(
        `Invalid current batch status: ${currentStatus}`,
      )
    }

    if (!allow.includes(nextEvent)) {
      throw new BadRequestException(
        `Invalid transition from status=${currentStatus} with event=${nextEvent}`,
      )
    }
  }
}
