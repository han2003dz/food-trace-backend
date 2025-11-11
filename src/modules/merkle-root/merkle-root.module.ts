import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MerkleRootEntity } from './entities/merkle-root.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MerkleRootEntity])],
  controllers: [],
  providers: [],
  exports: [],
})
export class MerkleRootModule {}
