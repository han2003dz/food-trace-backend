import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BatchEntity } from './entities/batches.entity'
import { BatchesService } from './batches.service'
import { BatchesController } from './batches.controller'
import { Product } from '../product/entities/product.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([BatchEntity]),
    TypeOrmModule.forFeature([Product]),
  ],
  providers: [BatchesService],
  controllers: [BatchesController],
  exports: [BatchesService],
})
export class BatchesModule {}
