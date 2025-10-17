import { Expose } from 'class-transformer'
import {
  CreateDateColumn,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export class BaseTimeEntity {
  @Expose({ name: 'created_at' })
  @CreateDateColumn({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Expose({ name: 'updated_at' })
  @UpdateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}

export class BaseIncrementEntity extends BaseTimeEntity {
  @PrimaryGeneratedColumn('increment')
  id: number
}

export class BaseUuidEntity extends BaseTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
}

export class GenericEntity<T> extends BaseTimeEntity {
  @PrimaryColumn()
  id: T
}
