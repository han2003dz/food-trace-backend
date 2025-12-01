import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Organizations } from './entities/organizations.entity'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'
import { User } from '../user/entities/user.entity'
import { UserService } from '../user/user.service'
import { ethers } from 'ethers'
import { ConfigService } from '@nestjs/config'
import foodTraceArtifact from '../crawl/contracts/TraceabilityMerkleRegistry.json'

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name)
  private readonly contract: ethers.Contract
  private readonly wallet: ethers.Wallet
  constructor(
    @InjectRepository(Organizations)
    private readonly orgRepo: Repository<Organizations>,

    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    const rpc = this.configService.getOrThrow<string>('RPC_URL')
    const pk = this.configService.getOrThrow<string>('COMMITTER_PRIVATE_KEY')
    const contractAddress =
      this.configService.getOrThrow<string>('CONTRACT_ADDRESS')

    const provider = new ethers.providers.JsonRpcProvider(rpc)
    this.wallet = new ethers.Wallet(pk, provider)
    this.contract = new ethers.Contract(
      contractAddress,
      foodTraceArtifact.abi,
      this.wallet,
    )
  }

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

  async create(dto: CreateOrganizationDto, user: User) {
    const ROLE_MAP = {
      PRODUCER: 1 << 0,
      PROCESSOR: 1 << 1,
      TRANSPORTER: 1 << 2,
      RETAILER: 1 << 3,
      AUDITOR: 1 << 4,
    } as const

    const roleValue = ROLE_MAP[dto.org_type]
    const exists = await this.orgRepo.findOne({
      where: { wallet_address: user.wallet_address },
    })

    if (exists) {
      throw new BadRequestException(
        'Organization with this wallet already exists',
      )
    }

    if (!roleValue) {
      throw new BadRequestException('Role value is not correct')
    }
    // 1️⃣ Create organization in DB
    const org = this.orgRepo.create({
      name: dto.name,
      org_type: dto.org_type,
      wallet_address: user.wallet_address.toLowerCase(),
      metadata_cid: dto.metadata_cid,
      active: dto.active ?? true,
      location: dto.location,
    })

    const savedOrg = await this.orgRepo.save(org)

    try {
      this.logger.log(
        `⛓ Setting on-chain role for ${user.wallet_address} → ${dto.org_type} (${roleValue})`,
      )

      const tx = await this.contract.setRoles(user.wallet_address, roleValue)
      await tx.wait()

      this.logger.log(`✅ Role set successfully (tx: ${tx.hash})`)
    } catch (err: any) {
      this.logger.error(`❌ Failed to set role on-chain: ${err.message}`)
      throw new BadRequestException(
        `Blockchain error when setting role: ${err.reason || err.message}`,
      )
    }

    const updatedUser = await this.userService.updateRoleByOrgType(
      user.id,
      dto.org_type,
      savedOrg,
    )

    return {
      organization: savedOrg,
      user: updatedUser,
    }
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

  async findByUser(user: User) {
    return this.orgRepo.findOne({
      where: { wallet_address: user.wallet_address },
    })
  }
}
