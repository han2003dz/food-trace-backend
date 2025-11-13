import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Product } from './entities/product.entity'
import { ProductController } from './product.controller'
import { ProductService } from './product.service'
import { JwtModule } from '@nestjs/jwt'
import { UserModule } from '../user/user.module'
import { Organizations } from '../organizations/entities/organizations.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Organizations]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    }),
    UserModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
