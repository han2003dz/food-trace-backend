import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { BatchTransferEntity } from './entities/batch-transfer.entity'
import { TransferService } from './transfer.service'
import { TransferController } from './transfer.controller'
import { BatchEntity } from '../batches/entities/batches.entity'
import { User } from '../user/entities/user.entity'
import { Organizations } from '../organizations/entities/organizations.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BatchTransferEntity,
      BatchEntity,
      User,
      Organizations,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    }),
  ],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
