import { Expose } from 'class-transformer'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { BaseUuidEntity } from './../../shared/base/base.entity'

@Entity('users')
export class User extends BaseUuidEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Expose({ name: 'wallet_address' })
  @Column({ name: 'wallet_address', unique: true })
  wallet_address: string

  @Expose({ name: 'username' })
  @Column({ name: 'username', unique: true, nullable: true })
  username: string

  @Expose({ name: 'role' })
  @Column({ name: 'role', default: 3 })
  role: number

  @Expose({ name: 'avatar' })
  @Column({ name: 'avatar', nullable: true })
  avatar: string
}
