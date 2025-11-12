import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { CreateAdminDto } from './dto/create-admin.dto'
import { RoleAccess } from './../../metadata/role.metadata'
import { ROLE } from '../../common/enums/user-role'
import { RolesGuard } from './../../guards/auth/roles.guard'

@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Post()
  @RoleAccess(ROLE.ADMIN)
  @UseGuards(RolesGuard)
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto)
  }
}
