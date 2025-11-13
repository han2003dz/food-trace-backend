import { Expose } from 'class-transformer'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseUuidEntity } from './../../shared/base/base.entity'
import { Organizations } from '@app/modules/organizations/entities/organizations.entity'

@Entity('users')
export class User extends BaseUuidEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null

  @Expose({ name: 'wallet_address' })
  @Column({ name: 'wallet_address', unique: true })
  wallet_address: string

  @Expose({ name: 'username' })
  @Column({ name: 'username', unique: true, nullable: true })
  username: string

  @Column({
    type: 'enum',
    enum: ['PRODUCER', 'RETAILER', 'LOGISTICS', 'AUDITOR', 'ADMIN', 'CONSUMER'],
    default: 'CONSUMER',
  })
  role: string

  @Expose({ name: 'avatar' })
  @Column({ name: 'avatar', nullable: true })
  avatar: string

  @ManyToOne(() => Organizations, (org) => org.users)
  @JoinColumn({ name: 'organization_id' })
  organization: Organizations
}
