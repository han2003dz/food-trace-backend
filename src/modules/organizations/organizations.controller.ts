import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common'
import { OrganizationsService } from './organizations.service'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'
import { Auth } from '@app/decorators/auth.decorator'
import { Request } from 'express'

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get('')
  findAll() {
    return this.orgService.findAll()
  }

  @Get('/my')
  @Auth()
  findByUser(@Req() req: Request) {
    return this.orgService.findByUser(req.user)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orgService.findOne(id)
  }

  @Post()
  @Auth()
  create(@Body() dto: CreateOrganizationDto, @Req() req: Request) {
    return this.orgService.create(dto, req.user)
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
