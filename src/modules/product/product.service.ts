import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Product } from './entities/product.entity'
import { Repository } from 'typeorm'
import { User } from '../user/entities/user.entity'
import { CreateProductDto } from './dto/create-product.dto'

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async createProduct(dto: CreateProductDto, user: User) {
    const exists = await this.productRepo.findOne({
      where: { name: dto.name, current_owner: user },
    })

    if (exists)
      throw new BadRequestException('Product already exists for this owner')

    const product = this.productRepo.create({
      ...dto,
      current_owner: user,
      owner_wallet: user.wallet_address,
    })
    return this.productRepo.save(product)
  }

  async listByOwner(user: User) {
    return this.productRepo.find({
      where: { owner_wallet: user.wallet_address },
      order: { created_at: 'DESC' },
      relations: ['current_owner'],
    })
  }
}
