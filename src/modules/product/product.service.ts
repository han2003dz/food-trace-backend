import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { ethers } from 'ethers'

import { Product } from './entities/product.entity'
import { Organizations } from '../organizations/entities/organizations.entity'
import { User } from '../user/entities/user.entity'
import { CreateProductDto } from './dto/create-product.dto'

import traceArtifact from '../crawl/contracts/TraceabilityMerkleRegistry.json'
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils'

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name)
  private readonly contract: ethers.Contract
  private readonly wallet: ethers.Wallet

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Organizations)
    private readonly orgRepo: Repository<Organizations>,

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
      traceArtifact.abi,
      this.wallet,
    )

    this.logger.log(`🔗 Connected to contract: ${contractAddress}`)
    this.logger.log(`👤 Using committer wallet: ${this.wallet.address}`)
  }

  /**
   * 🧩 Create a new product — both on-chain and off-chain.
   */
  async createProduct(dto: CreateProductDto, user: User) {
    try {
      // const organization = await this.resolveOrganization(dto, user)

      // await this.ensureProductNotExists(dto.name, organization.id)

      const metadataUri = dto.metadata_uri ?? ''
      const metadataHash = dto.metadata_hash ?? keccak256(toUtf8Bytes(dto.name))

      const imageUrl = dto.image_url ?? null

      const tx = await this.sendOnchainCreate(dto.name, metadataUri)
      const product = this.productRepo.create({
        name: dto.name,
        description: dto.description ?? null,
        image_url: imageUrl,

        origin: dto.origin ?? null,
        producer_name: dto.producer_name ?? null,
        manufacture_date: dto.manufacture_date ?? null,
        expiry_date: dto.expiry_date ?? null,

        category: dto.category ?? null,
        storage_conditions: dto.storage_conditions ?? null,
        nutritional_info: dto.nutritional_info ?? null,

        metadata_uri: metadataUri,
        metadata_hash: metadataHash,

        tx_hash_pending: tx.hash,
        onchain_product_id: null,
        onchain_synced: false,

        // organization,
        current_owner: user,
      })

      const saved = await this.productRepo.save(product)

      this.logger.log(
        `✅ Product created successfully: ${saved.name}, waiting on-chain sync.`,
      )

      return {
        id: saved.id,
        name: saved.name,
        tx_hash: tx.hash,
        onchain_product_id: null,
      }
    } catch (error) {
      return this.handleCreateError(error)
    }
  }

  /** 🧾 Get all products for a given user (off-chain) */
  async listByOwner(user: User) {
    return this.productRepo.find({
      where: { current_owner: { id: user.id } },
      order: { created_at: 'DESC' },
      relations: ['organization', 'batches'],
    })
  }

  /** 📦 Get all products (for admin/dashboard) */
  async findAll(): Promise<Product[]> {
    return this.productRepo.find({
      relations: ['organization', 'batches'],
      order: { created_at: 'DESC' },
    })
  }

  /** 🔍 Find one product by UUID */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['organization', 'batches'],
    })
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  async updateByTxHashPending(
    txHash: string,
    updates: Partial<Product>,
  ): Promise<Product | null> {
    const existing = await this.productRepo.findOne({
      where: { tx_hash_pending: txHash },
    })

    if (!existing) {
      this.logger.warn(`⚠️ No product found with pending tx_hash=${txHash}`)
      return null
    }

    Object.assign(existing, updates)

    const saved = await this.productRepo.save(existing)

    this.logger.log(
      `✅ Product updated from tx_hash_pending (product=${saved.name})`,
    )

    return saved
  }

  private async sendOnchainCreate(name: string, metadataUri: string) {
    try {
      const tx = await this.contract.createProduct(name, metadataUri)
      this.logger.log(`⛓️ TX sent: ${tx.hash}`)
      await tx.wait()
      return tx
    } catch (err: any) {
      this.logger.error(`❌ On-chain TX failed: ${err.message}`)
      throw new BadRequestException(
        `Blockchain transaction failed: ${err.reason || err.message}`,
      )
    }
  }

  private async ensureProductNotExists(name: string, orgId: string) {
    const exists = await this.productRepo.findOne({
      where: { name, organization: { id: orgId } },
    })

    if (exists) {
      throw new BadRequestException(
        'Product already exists in this organization',
      )
    }
  }

  private async resolveOrganization(dto: CreateProductDto, user: User) {
    if (dto.organization_id) {
      const org = await this.orgRepo.findOne({
        where: { id: dto.organization_id },
      })
      if (!org) throw new NotFoundException('Organization not found')
      return org
    }

    if (user.organization) return user.organization

    throw new BadRequestException(
      'User must belong to an organization or specify one.',
    )
  }

  private handleCreateError(error: any) {
    this.logger.error(
      `❌ Error creating product: ${error.message}`,
      error.stack,
    )

    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error
    }

    throw new BadRequestException('Failed to create product')
  }
}
