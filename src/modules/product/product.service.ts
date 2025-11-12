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
      // 1️⃣ Determine the organization
      let organization: Organizations | null = null

      if (dto.organization_id) {
        organization = await this.orgRepo.findOne({
          where: { id: dto.organization_id },
        })
        if (!organization) throw new NotFoundException('Organization not found')
      } else if (user.organization) {
        organization = user.organization
      } else {
        throw new BadRequestException(
          'User must belong to an organization or specify one.',
        )
      }

      // 2️⃣ Check if the product already exists
      const exists = await this.productRepo.findOne({
        where: {
          name: dto.name,
          organization: { id: organization.id },
        },
      })

      if (exists)
        throw new BadRequestException(
          'Product already exists in this organization',
        )

      // 3️⃣ Prepare data
      const imageUrl = dto.image_url || null
      const metadataUri = dto.metadata_uri || ''
      const metadataHash = dto.metadata_hash || keccak256(toUtf8Bytes(dto.name))

      // 4️⃣ Create product on-chain
      let tx, onchainProductId
      try {
        tx = await this.contract.createProduct(dto.name, metadataUri)
        this.logger.log(`⛓️ Sending createProduct TX: ${tx.hash}`)

        const receipt = await tx.wait()
        const event = receipt.logs
          .map((log) => {
            try {
              return this.contract.interface.parseLog(log)
            } catch {
              return null
            }
          })
          .find((e) => e && e.name === 'ProductCreated')

        onchainProductId = event?.args?.productId?.toString() ?? null

        if (!onchainProductId)
          this.logger.warn('⚠️ ProductCreated event not found in receipt')
      } catch (err: any) {
        this.logger.error(`❌ On-chain product creation failed: ${err.message}`)
        throw new BadRequestException(
          `Blockchain transaction failed: ${err.reason || err.message}`,
        )
      }

      // 5️⃣ Save in local database
      const product = this.productRepo.create({
        name: dto.name,
        description: dto.description,
        image_url: imageUrl,
        category: dto.category ?? null,
        storage_conditions: dto.storage_conditions ?? null,
        nutritional_info: dto.nutritional_info ?? null,
        metadata_uri: metadataUri,
        metadata_hash: metadataHash,
        onchain_product_id: onchainProductId ? Number(onchainProductId) : null,
        organization,
        current_owner: user,
      })

      const savedProduct = await this.productRepo.save(product)

      this.logger.log(
        `✅ Product created successfully: ${savedProduct.name}, onchainId=${onchainProductId}`,
      )

      return {
        id: savedProduct.id,
        name: savedProduct.name,
        onchain_product_id: onchainProductId,
        tx_hash: tx.hash,
      }
    } catch (error) {
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

  async updateOnchainProduct(
    onchainProductId: number,
    updates: Partial<Product>,
  ): Promise<Product | null> {
    const existing = await this.productRepo.findOne({
      where: { onchain_product_id: onchainProductId },
    })

    if (!existing) {
      this.logger.warn(
        `⚠️ Product with onchain ID ${onchainProductId} not found in DB.`,
      )
      return null
    }

    Object.assign(existing, updates)
    const saved = await this.productRepo.save(existing)

    this.logger.log(
      `✅ Product updated by onchainId=${onchainProductId} (${existing.name})`,
    )
    return saved
  }
}
