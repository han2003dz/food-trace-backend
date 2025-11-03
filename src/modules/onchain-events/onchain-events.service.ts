import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OnchainEventEntity } from './entities/onchain-events.entity'
import { ParsedEvent } from '../crawl/types/parsed-event.type'

@Injectable()
export class OnchainEventService {
  private readonly logger = new Logger(OnchainEventService.name)

  constructor(
    @InjectRepository(OnchainEventEntity)
    private readonly eventRepo: Repository<OnchainEventEntity>,
  ) {}

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
}
