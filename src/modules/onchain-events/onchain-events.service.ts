import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OnchainEventEntity } from './entities/onchain-events.entity'
import { CreateOnchainEventDto } from './dto/create-onchain-events.dto'

@Injectable()
export class OnchainEventService {
  private readonly logger = new Logger(OnchainEventService.name)

  constructor(
    @InjectRepository(OnchainEventEntity)
    private readonly eventRepo: Repository<OnchainEventEntity>,
  ) {}

  async saveEvents(events: CreateOnchainEventDto[]): Promise<void> {
    if (!events?.length) return

    try {
      await this.eventRepo.upsert(events, ['tx_hash'])
      this.logger.log(`✅ Saved ${events.length} onchain events`)
    } catch (error) {
      this.logger.error('❌ Failed to save onchain events:', error.message)
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
}
