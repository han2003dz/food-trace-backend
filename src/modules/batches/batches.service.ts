import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { keccak256, Logger, toUtf8Bytes } from 'ethers/lib/utils'
import { BatchEntity } from './entities/batches.entity'
import { Repository } from 'typeorm'
import MerkleTree from 'merkletreejs'
import { ConfigService } from '@nestjs/config'
import { ethers } from 'ethers'
import foodTraceArtifact from '../crawl/contracts/TraceabilityMerkleRegistry.json'
interface CreateBatch {
  batchCode: string
  fromEventId: number
  toEventId: number
  events: any[]
}

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name)
  private readonly contract: ethers.Contract
  private readonly wallet: ethers.Wallet
  constructor(
    @InjectRepository(BatchEntity)
    private readonly batchRepo: Repository<BatchEntity>,

    private readonly configService: ConfigService,
  ) {
    const rpc = this.configService.get<string>('RPC_URL')
    const pk = this.configService.get<string>('COMMITTER_PRIVATE_KEY')
    const contractAddress = this.configService.getOrThrow<string>(
      'config.contractAddress',
    )

    const provider = new ethers.providers.JsonRpcProvider(rpc)
    this.wallet = new ethers.Wallet(pk, provider)
    this.contract = new ethers.Contract(
      contractAddress,
      foodTraceArtifact.abi,
      this.wallet,
    )

    this.logger.debug(
      `Initialized BatchesService with committer: ${this.wallet.address}`,
    )
  }

  async upsert(data: Partial<BatchEntity>): Promise<BatchEntity> {
    const existing = await this.batchRepo.findOne({
      where: { batch_code: data.batch_code },
    })

    if (existing) {
      const updated = Object.assign(existing, data)
      this.logger.debug(`Updated batch ${data.batch_code}`)
      return this.batchRepo.save(updated)
    }

    const newBatch = this.batchRepo.create(data)
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
    return this.batchRepo.find({ order: { created_at: 'DESC' } })
  }

  async createBatchOnchain(data: CreateBatch) {
    const { batchCode, fromEventId, toEventId, events } = data
    if (!batchCode) throw new Error('Batch code is required')
    const leaves = events.map((e) => keccak256(toUtf8Bytes(JSON.stringify(e))))
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
    const root = tree.getHexRoot()

    this.logger.debug(`Generated Merkle Root: ${root}`)

    const tx = await this.contract.commitWithBatchCode(
      root,
      fromEventId,
      toEventId,
      batchCode,
    )

    const receipt = await tx.wait()
    this.logger.debug(
      `✅ Batch committed on-chain: ${batchCode}, tx=${receipt.hash}`,
    )
  }
}
