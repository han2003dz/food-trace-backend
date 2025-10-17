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

  @Column()
  name: string

  @Column({ nullable: true })
  origin: string

  @Column({ type: 'date', nullable: true })
  manufacture_date: Date

  @Column({ type: 'date', nullable: true })
  expiry_date: Date

  @ManyToOne(() => User)
  @Index('idx_products_owner')
  current_owner: User

  @Index('idx_products_onchain_id')
  @Column({ type: 'bigint', unique: true, nullable: true })
  onchain_id: number

  @Column({ nullable: true })
  tx_hash: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
