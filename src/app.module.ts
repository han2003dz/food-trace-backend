import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import config from 'config'
import configEnv from './config/default.config'
import redisConfig from './config/redis.config'
import { AuthGuard } from './guards/auth/auth.guard'
import { AuthModule } from './modules/auth/auth.module'
import { CacheModule } from './modules/cache/cache.module'
import { LoggerModule } from './modules/logger/logger.module'
import { UserModule } from './modules/user/user.module'
import { AdminModule } from './modules/admin/admin.module'
import { ProductModule } from './modules/product/product.module'
import { DatabaseModule } from './database/database.module'
import { BatchesModule } from './modules/batches/batches.module'
import { PublicTraceModule } from './modules/public-trace/public-trace.module'
import { MerkleRootModule } from './modules/merkle-root/merkle-root.module'
import { QrScanLogModule } from './modules/qr-scan-logs/qr-scan-logs.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config.util.toObject(), redisConfig, configEnv],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return [
          {
            ttl: config.get('secure.rateLimit.ttl'),
            limit: config.get('secure.rateLimit.limit'),
          },
        ]
      },
    }),
    CacheModule,
    AuthModule,
    LoggerModule,
    UserModule,
    DatabaseModule,
    AdminModule,
    ProductModule,
    BatchesModule,
    ProductModule,
    PublicTraceModule,
    MerkleRootModule,
    QrScanLogModule,
    OrganizationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
