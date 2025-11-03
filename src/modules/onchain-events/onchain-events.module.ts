import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OnchainEventEntity } from './entities/onchain-events.entity'
import { OnchainEventService } from './onchain-events.service'
import { OnchainEventsController } from './onchain-events.controller'

@Module({
  imports: [TypeOrmModule.forFeature([OnchainEventEntity])],
  providers: [OnchainEventService],
  controllers: [OnchainEventsController],
  exports: [OnchainEventService],
})
export class OnchainEventModule {}
