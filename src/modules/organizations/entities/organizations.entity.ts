import { BatchEntity } from '@app/modules/batches/entities/batches.entity'
import { CertificationEntity } from '@app/modules/certification/entities/certification.entity'
import { Product } from '@app/modules/product/entities/product.entity'
import { User } from '@app/modules/user/entities/user.entity'
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('organizations')
export class Organizations {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({
    type: 'enum',
    enum: ['PRODUCER', 'RETAILER', 'LOGISTICS', 'AUDITOR', 'ADMIN'],
  })
  org_type: string

  @Column({ unique: true })
  wallet_address: string

  @Column({ nullable: true })
  metadata_cid: string

  @Column({ default: true })
  active: boolean

  @OneToMany(() => User, (user) => user.organization)
  users: User[]

  @OneToMany(() => Product, (product) => product.organization)
  products: Product[]

  @OneToMany(() => BatchEntity, (batch) => batch.creator_org)
  created_batches: BatchEntity[]

  @OneToMany(() => CertificationEntity, (cert) => cert.issuer_org)
  issued_certifications: CertificationEntity[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
