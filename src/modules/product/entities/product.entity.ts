import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import { User } from './../../user/entities/user.entity'

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('idx_product_name')
  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  category_id: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  origin: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  producer_name: string | null

  @Column({ type: 'date', nullable: true })
  manufacture_date: Date | null

  @Column({ type: 'date', nullable: true })
  expiry_date: Date | null

  @Index('idx_products_owner')
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  current_owner: User | null

  @Column({ type: 'varchar', length: 42, nullable: true })
  owner_wallet: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url?: string | null

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'jsonb', nullable: true })
  certifications?: {
    type: string
    issuer: string
    id: string
  }[]

  @Column({ type: 'varchar', nullable: true })
  storage_conditions?: string

  @Column({ type: 'jsonb', nullable: true })
  nutritional_info?: Record<string, any>

  @Index('idx_products_onchain_id')
  @Column({ type: 'bigint', unique: true, nullable: true })
  onchain_id: number | null

  @Column({ type: 'varchar', length: 66, nullable: true })
  leaf_hash: string | null

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
