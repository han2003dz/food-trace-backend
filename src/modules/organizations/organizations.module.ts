import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Organizations } from './entities/organizations.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Organizations])],
  controllers: [],
  providers: [],
  exports: [],
})
export class OrganizationsModule {}
