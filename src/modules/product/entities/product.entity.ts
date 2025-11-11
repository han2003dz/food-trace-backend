import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm'
import { Organizations } from '@app/modules/organizations/entities/organizations.entity'
import { BatchEntity } from '@app/modules/batches/entities/batches.entity'
import { User } from '@app/modules/user/entities/user.entity'

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Organizations, (org) => org.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organizations

  @Index('idx_product_name')
  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url?: string | null

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  storage_conditions?: string

  @Column({ type: 'jsonb', nullable: true })
  nutritional_info?: Record<string, any>

  @Column({ type: 'varchar', nullable: true })
  metadata_uri: string

  @Column({ type: 'varchar', length: 66, nullable: true })
  metadata_hash: string | null

  @Index('idx_products_onchain_id')
  @Column({ type: 'bigint', unique: true, nullable: true })
  onchain_product_id: number | null

  @OneToMany(() => BatchEntity, (batch) => batch.product)
  batches: BatchEntity[]

  @Index('idx_products_owner')
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  current_owner: User | null

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
