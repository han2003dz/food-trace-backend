import { BatchEntity } from '@app/modules/batches/entities/batches.entity'
import { Organizations } from '@app/modules/organizations/entities/organizations.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm'

@Entity('merkle_roots')
export class MerkleRootEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @OneToOne(() => BatchEntity, (b) => b.merkle_root)
  @JoinColumn({ name: 'batch_id' })
  batch: BatchEntity

  @Column()
  merkle_root: string

  @ManyToOne(() => Organizations)
  @JoinColumn({ name: 'committed_by_org_id' })
  committed_by_org: Organizations

  @Column({ nullable: true })
  tx_hash: string

  @Column({ nullable: true })
  root_hash: string

  @Column({ nullable: true })
  block_number: number

  @CreateDateColumn()
  created_at: Date
}
