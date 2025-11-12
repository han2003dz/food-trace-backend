import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BatchEntity } from './entities/batches.entity'
import { BatchesService } from './batches.service'
import { BatchesController } from './batches.controller'
import { Product } from '../product/entities/product.entity'
import { Organizations } from '../organizations/entities/organizations.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([BatchEntity]),
    TypeOrmModule.forFeature([Product]),
    TypeOrmModule.forFeature([Organizations]),
  ],
  providers: [BatchesService],
  controllers: [BatchesController],
  exports: [BatchesService],
})
export class BatchesModule {}
