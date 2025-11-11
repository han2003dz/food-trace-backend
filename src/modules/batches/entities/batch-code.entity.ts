import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm'
import { BatchEntity } from './batches.entity'

@Entity('batch_codes')
export class BatchCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @OneToOne(() => BatchEntity, (b) => b.code)
  @JoinColumn({ name: 'batch_id' })
  batch: BatchEntity

  @Column({ unique: true })
  batch_code: string

  @Column({ unique: true })
  batch_code_hash: string

  @Column({ nullable: true })
  qr_image_url: string

  @CreateDateColumn()
  created_at: Date
}
