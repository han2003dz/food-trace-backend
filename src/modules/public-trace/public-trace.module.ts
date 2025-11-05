import { Module } from '@nestjs/common'
import { PublicTraceController } from './public-trace.controller'
import { PublicTraceService } from './public-trace.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BatchEntity } from '../batches/entities/batches.entity'

@Module({
  imports: [TypeOrmModule.forFeature([BatchEntity])],
  controllers: [PublicTraceController],
  providers: [PublicTraceService],
  exports: [PublicTraceService],
})
export class PublicTraceModule {}
