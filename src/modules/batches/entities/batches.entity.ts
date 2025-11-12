import { Organizations } from '@app/modules/organizations/entities/organizations.entity'
import { Product } from '@app/modules/product/entities/product.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm'
import { BatchEventEntity } from './batch-event.entity'
import { BatchCodeEntity } from './batch-code.entity'
import { MerkleRootEntity } from '@app/modules/merkle-root/entities/merkle-root.entity'
import { BatchCertificationEntity } from '@app/modules/certification/entities/batch-certification.entity'

@Entity('batches')
export class BatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Product, (p) => p.batches)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @ManyToOne(() => Organizations)
  @JoinColumn({ name: 'creator_org_id' })
  creator_org: Organizations

  @ManyToOne(() => Organizations)
  @JoinColumn({ name: 'current_owner_id' })
  current_owner: Organizations

  @Column({ type: 'bigint', nullable: true })
  onchain_batch_id: number

  @Column()
  initial_data_hash: string

  @Column({ nullable: true })
  metadata_uri: string

  @Column({
    type: 'enum',
    enum: [
      'HARVESTED',
      'PROCESSED',
      'IN_TRANSIT',
      'WAREHOUSE',
      'SOLD',
      'RECALLED',
    ],
    default: 'HARVESTED',
  })
  status: string

  @Column({ default: false })
  closed: boolean

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @OneToMany(() => BatchEventEntity, (event) => event.batch)
  events: BatchEventEntity[]

  @OneToOne(() => BatchCodeEntity, (code) => code.batch)
  code: BatchCodeEntity

  @OneToOne(() => MerkleRootEntity, (m) => m.batch)
  merkle_root: MerkleRootEntity

  @OneToMany(() => BatchCertificationEntity, (bc) => bc.batch)
  certifications: BatchCertificationEntity[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
