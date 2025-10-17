import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../user/entities/user.entity'
import { CreateAdminDto } from './dto/create-admin.dto'
import { ROLE } from '../../common/enums/user-role'

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createAdmin(dto: CreateAdminDto) {
    const existedUser = await this.userRepository.findOne({
      where: { wallet_address: dto.wallet_address },
    })
    if (existedUser) {
      existedUser.role = ROLE.ADMIN
      return this.userRepository.save(existedUser)
    }
    const newAdmin = this.userRepository.create({
      wallet_address: dto.wallet_address,
      role: ROLE.ADMIN,
    })
    return this.userRepository.save(newAdmin)
  }
}
