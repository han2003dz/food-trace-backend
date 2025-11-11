import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('qr_scan_logs')
export class QrScanLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  batch_code: string

  @Column({ nullable: true })
  user_ip: string

  @Column({ nullable: true })
  user_agent: string

  @CreateDateColumn()
  scanned_at: Date
}
