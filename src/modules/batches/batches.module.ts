import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BatchEntity } from './entities/batches.entity'
import { BatchesService } from './batches.service'
import { BatchesController } from './batches.controller'
import { Product } from '../product/entities/product.entity'
import { BatchEventEntity } from './entities/batch-event.entity'
import { Organizations } from '../organizations/entities/organizations.entity'
import { BatchCodeEntity } from './entities/batch-code.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BatchEntity,
      BatchEventEntity,
      Product,
      Organizations,
      BatchCodeEntity,
    ]),
  ],
  providers: [BatchesService],
  controllers: [BatchesController],
  exports: [BatchesService],
})
export class BatchesModule {}
