import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Organizations } from './entities/organizations.entity'
import { OrganizationsService } from './organizations.service'
import { OrganizationsController } from './organizations.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Organizations])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
