import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Product } from './entities/product.entity'
import { Repository } from 'typeorm'
import { User } from '../user/entities/user.entity'
import { CreateProductDto } from './dto/create-product.dto'
import { Organizations } from '../organizations/entities/organizations.entity'

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name)
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Organizations)
    private readonly orgRepo: Repository<Organizations>,
  ) {}

  async createProduct(dto: CreateProductDto, user: User) {
    try {
      let organization: Organizations | null = null
      if (dto.organization_id) {
        organization = await this.orgRepo.findOne({
          where: { id: dto.organization_id },
        })
        if (!organization) {
          throw new NotFoundException('Organization not found')
        }
      } else if (user.organization) {
        organization = user.organization
      } else {
        throw new BadRequestException(
          'User must belong to an organization or specify one.',
        )
      }

      const exists = await this.productRepo.findOne({
        where: {
          name: dto.name,
          organization: { id: organization.id },
        },
      })
      if (exists) {
        throw new BadRequestException(
          'Product already exists in this organization',
        )
      }

      let imageUrl: string | null = null
      if (dto.image_url) {
        imageUrl = dto.image_url
      }

      const product = this.productRepo.create({
        name: dto.name,
        description: dto.description,
        category: dto.category,
        image_url: imageUrl,
        storage_conditions: dto.storage_conditions,
        nutritional_info: dto.nutritional_info,
        metadata_uri: dto.metadata_uri,
        metadata_hash: dto.metadata_hash,
        onchain_product_id: dto.onchain_product_id ?? null,
        organization,
        current_owner: user,
      })

      const savedProduct = await this.productRepo.save(product)

      this.logger.log(`✅ Product created successfully: ${savedProduct.id}`)
      return savedProduct
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

  async listByOwner(user: User) {
    return this.productRepo.find({
      where: { current_owner: user },
      order: { created_at: 'DESC' },
      relations: ['current_owner'],
    })
  }

  async findAll(): Promise<Product[]> {
    return this.productRepo.find({
      relations: ['organization'],
      order: { created_at: 'DESC' },
    })
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['organization', 'batches'],
    })
    if (!product) throw new NotFoundException('Product not found')
    return product
  }
}
