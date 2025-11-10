import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Product } from './entities/product.entity'
import { Repository } from 'typeorm'
import { User } from '../user/entities/user.entity'
import { CreateProductDto } from './dto/create-product.dto'

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name)
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async createProduct(dto: CreateProductDto, user: User) {
    try {
      const exists = await this.productRepo.findOne({
        where: { name: dto.product_name, current_owner: { id: user.id } },
      })

      if (exists) {
        throw new BadRequestException('Product already exists for this owner')
      }

      const manufactureDate = new Date(dto.manufacture_date)
      const expiryDate = new Date(dto.expiry_date)

      if (expiryDate <= manufactureDate) {
        throw new BadRequestException(
          'Expiry date must be after manufacture date',
        )
      }

      // Handle image upload (if base64)
      let imageUrl: string | null = null
      if (dto.image) {
        // If you have a separate upload service, use it here
        // For now, we'll store the base64 directly (not recommended for production)
        // imageUrl = await this.uploadService.uploadBase64(dto.image);
        imageUrl = dto.image
      }

      const product = this.productRepo.create({
        name: dto.product_name,
        origin: dto.origin,
        category_id: dto.category_id,
        producer_name: dto.producer_name,
        manufacture_date: manufactureDate,
        expiry_date: expiryDate,
        description: dto.description,
        image_url: imageUrl,
        certifications: dto.certifications,
        storage_conditions: dto.storage_conditions,
        nutritional_info: dto.nutritional_info,
        current_owner: user,
        owner_wallet: user.wallet_address,
      })

      const savedProduct = await this.productRepo.save(product)

      this.logger.log(`Product created successfully: ${savedProduct.id}`)

      return savedProduct
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`, error.stack)

      if (error instanceof BadRequestException) {
        throw error
      }

      throw new BadRequestException('Failed to create product')
    }
  }

  async listByOwner(user: User) {
    return this.productRepo.find({
      where: { owner_wallet: user.wallet_address },
      order: { created_at: 'DESC' },
      relations: ['current_owner'],
    })
  }
}
