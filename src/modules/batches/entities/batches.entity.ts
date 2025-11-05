import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import { User } from '../../user/entities/user.entity'
import { Product } from '../../product/entities/product.entity'
import { OnchainEventEntity } from '@app/modules/onchain-events/entities/onchain-events.entity'

@Entity('batches')
export class BatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('idx_batch_code_unique', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  batch_code: string

  @Index('idx_batch_onchain_id')
  @Column({ type: 'bigint', nullable: true })
  onchain_batch_id: number | null

  @Column({ type: 'varchar', length: 66, nullable: true })
  batch_code_hash: string | null

  @Index('idx_batch_committer')
  @Column({ type: 'varchar', length: 42, nullable: true })
  committer: string | null

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Product | null

  @Column({ type: 'uuid', nullable: true })
  product_id: string | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User | null

  @Column({ type: 'uuid', nullable: true })
  owner_id: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  origin: string | null

  @Index('idx_batch_status')
  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status: string

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => OnchainEventEntity, (event) => event.batch)
  onchain_events: OnchainEventEntity[]
}
