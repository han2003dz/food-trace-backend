import { Expose } from 'class-transformer'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { BaseUuidEntity } from './../../shared/base/base.entity'
import { Organizations } from '@app/modules/organizations/entities/organizations.entity'

@Entity('users')
export class User extends BaseUuidEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Expose({ name: 'wallet_address' })
  @Column({ name: 'wallet_address', unique: true })
  wallet_address: string

  @Expose({ name: 'username' })
  @Column({ name: 'username', unique: true, nullable: true })
  username: string

  @Column({
    type: 'enum',
    enum: ['ADMIN', 'MANAGER', 'MEMBER'],
    default: 'MEMBER',
  })
  role: string

  @Expose({ name: 'avatar' })
  @Column({ name: 'avatar', nullable: true })
  avatar: string

  @ManyToOne(() => Organizations, (org) => org.users)
  @JoinColumn({ name: 'organization_id' })
  organization: Organizations

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
