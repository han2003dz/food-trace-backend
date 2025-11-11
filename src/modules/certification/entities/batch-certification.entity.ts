import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { CertificationEntity } from './certification.entity'
import { BatchEntity } from '@app/modules/batches/entities/batches.entity'

@Entity('batch_certifications')
export class BatchCertificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => BatchEntity, (b) => b.certifications)
  @JoinColumn({ name: 'batch_id' })
  batch: BatchEntity

  @ManyToOne(() => CertificationEntity, (c) => c.linked_batches)
  @JoinColumn({ name: 'certification_id' })
  certification: CertificationEntity
}
