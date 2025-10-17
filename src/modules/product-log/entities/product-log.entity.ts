import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm'
import { Product } from './../../product/entities/product.entity'
import { User } from './../../user/entities/user.entity'

@Entity('product_logs')
export class ProductLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Product)
  @Index('idx_product_logs_product_id')
  product: Product

  @ManyToOne(() => User)
  @Index('idx_product_logs_user_id')
  user: User

  @Column({ nullable: true })
  description: string

  @Column({ nullable: true })
  tx_hash: string

  @CreateDateColumn()
  @Index('idx_product_logs_created_at')
  created_at: Date
}
