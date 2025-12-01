import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Organizations } from '@app/modules/organizations/entities/organizations.entity'
import { User } from '@app/modules/user/entities/user.entity'
import { BatchEntity } from '../batches/entities/batches.entity'
import {
  BatchTransferEntity,
  TransferStatus,
} from './entities/batch-transfer.entity'

interface TransferDto {
  to_org_id: string
  note?: string
}

@Injectable()
export class TransferService {
  constructor(
    @InjectRepository(BatchEntity)
    private readonly batchRepo: Repository<BatchEntity>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(BatchTransferEntity)
    private readonly transferRepo: Repository<BatchTransferEntity>,

    @InjectRepository(Organizations)
    private readonly orgRepo: Repository<Organizations>,
  ) {}

  async transferBatch(batchId: string, dto: TransferDto, user: User) {
    // chạy song song — nhanh hơn 40–60%
    const [batch, newUser] = await Promise.all([
      this.batchRepo.findOne({
        where: { id: batchId },
        relations: ['current_owner'],
      }),

      this.userRepo.findOne({
        where: { id: user.id },
        relations: ['organization'],
      }),
    ])

    if (!batch) throw new NotFoundException('Batch not found')

    if (!newUser) throw new UnauthorizedException('User not found')

    if (!newUser.organization) {
      throw new ForbiddenException('User does not belong to any organization')
    }

    if (!batch.current_owner) {
      throw new BadRequestException('Batch has no current owner')
    }

    // Kiểm tra quyền sở hữu batch
    if (batch.current_owner.id !== newUser.organization.id) {
      throw new ForbiddenException('You are not the owner of this batch')
    }

    // Kiểm tra tổ chức nhận có tồn tại không (BEST PRACTICE)
    const receiverOrg = await this.orgRepo.findOne({
      where: { id: dto.to_org_id },
    })

    if (!receiverOrg) {
      throw new NotFoundException('Receiver organization not found')
    }

    // Tạo record transfer
    const transfer = this.transferRepo.create({
      batch,
      from_org: batch.current_owner,
      to_org: receiverOrg,
      initiator_user: newUser,
      note: dto.note,
      status: TransferStatus.PENDING,
    })

    // Option: clear pending wallet
    batch.pending_receiver_wallet = null

    await this.transferRepo.save(transfer)

    return transfer
  }

  async acceptTransfer(id: string, user: User) {
    const transfer = await this.transferRepo.findOne({
      where: { id },
      relations: ['batch', 'to_org'],
    })

    if (!transfer) throw new NotFoundException('Transfer not found')
    if (transfer.to_org.id !== user.organization.id)
      throw new ForbiddenException('You are not the receiver')

    transfer.status = TransferStatus.ACCEPTED
    await this.transferRepo.save(transfer)

    // Cập nhật owner batch
    transfer.batch.current_owner = transfer.to_org
    transfer.batch.pending_receiver_wallet = null
    await this.batchRepo.save(transfer.batch)

    return transfer
  }

  async rejectTransfer(id: string, user: User) {
    const transfer = await this.transferRepo.findOne({
      where: { id },
      relations: ['to_org'],
    })

    if (!transfer) throw new NotFoundException('Transfer not found')
    if (transfer.to_org.id !== user.organization.id)
      throw new ForbiddenException('You are not the receiver')

    transfer.status = TransferStatus.REJECTED
    await this.transferRepo.save(transfer)
    return transfer
  }

  async getIncomingTransfers(user: User) {
    return this.transferRepo.find({
      where: {
        to_org: { id: user.organization.id },
        status: TransferStatus.PENDING,
      },
      relations: ['batch', 'from_org', 'to_org'],
    })
  }
}
