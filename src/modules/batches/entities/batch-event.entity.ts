import { BatchEntity } from '@app/modules/batches/entities/batches.entity'
import { Organizations } from '@app/modules/organizations/entities/organizations.entity'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('batch_events')
export class BatchEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => BatchEntity, (b) => b.events)
  @JoinColumn({ name: 'batch_id' })
  batch: BatchEntity

  @Column({
    type: 'enum',
    enum: [
      'CREATED',
      'PROCESSED',
      'SHIPPED',
      'RECEIVED',
      'STORED',
      'SOLD',
      'RECALLED',
    ],
  })
  event_type: string

  @ManyToOne(() => Organizations)
  @JoinColumn({ name: 'actor_org_id' })
  actor_org: Organizations

  @Column({ nullable: true })
  metadata_uri: string

  @Column({ nullable: true })
  data_hash: string

  @Column({ nullable: true })
  tx_hash: string

  @Column({ type: 'bigint', nullable: true })
  block_number: number

  @Column({ type: 'timestamp', nullable: true })
  timestamp: Date

  @CreateDateColumn()
  created_at: Date
}
