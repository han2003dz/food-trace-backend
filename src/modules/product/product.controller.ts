import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { ProductService } from './product.service'
import { ApiOperation } from '@nestjs/swagger'
import { CreateProductDto } from './dto/create-product.dto'
import { Request } from 'express'
import { Auth } from '@app/decorators/auth.decorator'

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('/create')
  @Auth()
  @ApiOperation({ summary: 'Create Product' })
  create(@Body() dto: CreateProductDto, @Req() req: Request) {
    return this.productService.createProduct(dto, req.user)
  }

  @Get()
  @ApiOperation({ summary: 'List my products' })
  list(@Req() req: Request) {
    return this.productService.listByOwner(req.user)
  }
}
