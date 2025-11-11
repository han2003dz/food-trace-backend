import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
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

  @Column({ type: 'timestamp', nullable: true })
  block_timestamp: Date

  @Column({
    type: 'enum',
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    default: 'CONFIRMED',
  })
  status: string

  @CreateDateColumn()
  created_at: Date
}
