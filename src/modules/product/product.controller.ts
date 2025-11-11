import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common'
import { ProductService } from './product.service'
import { ApiOperation } from '@nestjs/swagger'
import { CreateProductDto } from './dto/create-product.dto'
import { Request } from 'express'
import { Auth } from '@app/decorators/auth.decorator'

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll() {
    return this.productService.findAll()
  }

  @Post('/create')
  @Auth()
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() dto: CreateProductDto, @Req() req: Request) {
    return this.productService.createProduct(dto, req.user)
  }

  @Get('/my')
  @ApiOperation({ summary: 'List my products' })
  listByOwner(@Req() req: Request) {
    return this.productService.listByOwner(req.user)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id)
  }
}
