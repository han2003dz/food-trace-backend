import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm'
import { User } from '@app/modules/user/entities/user.entity'
import { Organizations } from '@app/modules/organizations/entities/organizations.entity'
import { BatchEntity } from '@app/modules/batches/entities/batches.entity'

export enum TransferStatus {
  PENDING = 'PENDING', // Đã gửi, chờ người nhận xác nhận
  ACCEPTED = 'ACCEPTED', // Người nhận đồng ý
  REJECTED = 'REJECTED', // Người nhận từ chối
  CANCELLED = 'CANCELLED', // Người gửi hủy
}

@Entity('batch_transfers')
export class BatchTransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => BatchEntity)
  @JoinColumn({ name: 'batch_id' })
  batch: BatchEntity

  @ManyToOne(() => Organizations)
  @JoinColumn({ name: 'from_org_id' })
  from_org: Organizations

  @ManyToOne(() => Organizations)
  @JoinColumn({ name: 'to_org_id' })
  to_org: Organizations

  @ManyToOne(() => User)
  @JoinColumn({ name: 'initiator_user_id' })
  initiator_user: User // người gửi thao tác

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
  })
  status: TransferStatus

  @Column({ nullable: true })
  note: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
