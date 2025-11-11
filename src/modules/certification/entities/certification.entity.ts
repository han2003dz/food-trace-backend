import { Organizations } from '@app/modules/organizations/entities/organizations.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm'
import { BatchCertificationEntity } from './batch-certification.entity'

@Entity('certifications')
export class CertificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => Organizations, (org) => org.issued_certifications)
  @JoinColumn({ name: 'issuer_org_id' })
  issuer_org: Organizations

  @Column()
  subject: string

  @Column({ nullable: true })
  metadata_uri: string

  @Column({ nullable: true })
  metadata_hash: string

  @Column({ type: 'timestamp', nullable: true })
  expire_at: Date

  @Column({ default: true })
  active: boolean

  @OneToMany(() => BatchCertificationEntity, (bc) => bc.certification)
  linked_batches: BatchCertificationEntity[]

  @CreateDateColumn()
  created_at: Date
}
