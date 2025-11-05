import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OnchainEventEntity } from './entities/onchain-events.entity'
import { ParsedEvent } from '../crawl/types/parsed-event.type'
import { ConfigService } from '@nestjs/config'
import { ethers } from 'ethers'
import foodTraceArtifact from '../crawl/contracts/TraceabilityMerkleRegistry.json'
@Injectable()
export class OnchainEventService {
  private readonly logger = new Logger(OnchainEventService.name)
  private readonly contract: ethers.Contract
  private readonly wallet: ethers.Wallet

  constructor(
    @InjectRepository(OnchainEventEntity)
    private readonly eventRepo: Repository<OnchainEventEntity>,
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

  async saveEvents(events: ParsedEvent[]) {
    if (!events.length) return

    try {
      await this.eventRepo
        .createQueryBuilder()
        .insert()
        .values(events)
        .orUpdate(['args', 'block_number'], ['tx_hash', 'event_name'])
        .execute()

      this.logger.log(`Saved ${events.length} onchain events`)
    } catch (error) {
      this.logger.error('Failed to save onchain events:', error)
      throw error
    }
  }

  async findAll(): Promise<OnchainEventEntity[]> {
    return this.eventRepo.find({ order: { block_number: 'DESC' } })
  }

  async findByEventName(event_name: string): Promise<OnchainEventEntity[]> {
    return this.eventRepo.find({
      where: { event_name },
      order: { block_number: 'DESC' },
    })
  }

  async findByProductId(productId: string) {
    return this.eventRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.batch', 'b')
      .leftJoinAndSelect('b.product', 'p')
      .where('p.id = :productId', { productId })
      .orderBy('e.created_at', 'ASC')
      .getMany()
  }

  async isPaused(): Promise<boolean> {
    return this.contract.paused()
  }

  async commitWithBatchCode(
    root: `0x${string}`,
    fromId: number,
    toId: number,
    batchCode: string,
  ) {
    const tx = await this.contract.commitWithBatchCode(
      root,
      fromId,
      toId,
      batchCode,
    )
    return tx.wait() // receipt
  }

  async totalBatches(): Promise<number> {
    const n: bigint = await this.contract.totalBatches()
    return Number(n)
  }
}
