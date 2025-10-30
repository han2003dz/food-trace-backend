import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

@Entity('onchain_events')
export class OnchainEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'varchar', length: 255 })
  event_name: string

  @Column({ type: 'jsonb', nullable: false })
  args: Record<string, any>

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 66 })
  tx_hash: string

  @Index()
  @Column({ type: 'bigint' })
  block_number: number

  @Column({ type: 'varchar', length: 42 })
  contract_address: string

  @CreateDateColumn()
  created_at: Date
}
