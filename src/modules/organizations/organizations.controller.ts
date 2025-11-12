import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { OrganizationsService } from './organizations.service'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get()
  findAll() {
    return this.orgService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orgService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.orgService.create(dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orgService.remove(id)
  }
}
