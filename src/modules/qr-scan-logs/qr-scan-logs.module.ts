import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QrScanLogEntity } from './entities/qr-scan-logs.entity'

@Module({
  imports: [TypeOrmModule.forFeature([QrScanLogEntity])],
  controllers: [],
  providers: [],
  exports: [],
})
export class QrScanLogModule {}
