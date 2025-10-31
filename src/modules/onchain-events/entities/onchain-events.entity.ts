import { BatchEntity } from '@app/modules/batches/entities/batches.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm'

@Entity('onchain_events')
@Index('uq_event_tx_hash', ['tx_hash', 'event_name'], { unique: true })
export class OnchainEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column()
  event_name: string

  @Column({ type: 'jsonb' })
  args: Record<string, any>

  @Column({ type: 'varchar', length: 255 })
  tx_hash: string

  @Column({ type: 'int' })
  block_number: number

  @Column({ type: 'varchar', length: 66 })
  contract_address: string

  @ManyToOne(() => BatchEntity, (batch) => batch.onchain_events, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'batch_id' })
  batch: BatchEntity | null

  @Column({ type: 'uuid', nullable: true })
  batch_id: string | null

  @CreateDateColumn()
  created_at: Date
}
