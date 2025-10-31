import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BatchEntity } from './entities/batches.entity'
import { BatchesService } from './batches.service'

@Module({
  imports: [TypeOrmModule.forFeature([BatchEntity])],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
