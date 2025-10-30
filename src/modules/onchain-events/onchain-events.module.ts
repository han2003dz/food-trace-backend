import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OnchainEventEntity } from './entities/onchain-events.entity'
import { OnchainEventService } from './onchain-events.service'

@Module({
  imports: [TypeOrmModule.forFeature([OnchainEventEntity])],
  providers: [OnchainEventService],
  exports: [OnchainEventService],
})
export class OnchainEventModule {}
