import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductLog } from './entities/product-log.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ProductLog])],
  controllers: [],
  providers: [],
  exports: [],
})
export class ProductLogModule {}
