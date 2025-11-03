import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BatchEntity } from './entities/batches.entity'
import { BatchesService } from './batches.service'
import { BatchesController } from './batches.controller'

@Module({
  imports: [TypeOrmModule.forFeature([BatchEntity])],
  providers: [BatchesService],
  controllers: [BatchesController],
  exports: [BatchesService],
})
export class BatchesModule {}
