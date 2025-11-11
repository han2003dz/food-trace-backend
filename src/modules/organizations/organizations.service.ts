import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Organizations } from './entities/organizations.entity'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organizations)
    private readonly orgRepo: Repository<Organizations>,
  ) {}

  async findAll() {
    return this.orgRepo.find({
      order: { created_at: 'DESC' },
      relations: ['users', 'products'],
    })
  }

  async findOne(id: string) {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['users', 'products'],
    })
    if (!org) throw new NotFoundException('Organization not found')
    return org
  }

  async create(dto: CreateOrganizationDto) {
    const exists = await this.orgRepo.findOne({
      where: { wallet_address: dto.wallet_address.toLowerCase() },
    })
    if (exists) {
      throw new BadRequestException(
        'Organization with this wallet already exists',
      )
    }

    const org = this.orgRepo.create({
      name: dto.name,
      org_type: dto.org_type,
      wallet_address: dto.wallet_address.toLowerCase(),
      metadata_cid: dto.metadata_cid,
      active: dto.active ?? true,
    })

    return this.orgRepo.save(org)
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.findOne(id)
    Object.assign(org, dto)
    return this.orgRepo.save(org)
  }

  async remove(id: string) {
    const org = await this.findOne(id)
    org.active = false
    return this.orgRepo.save(org)
  }
}
