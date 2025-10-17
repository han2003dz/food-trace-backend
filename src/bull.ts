import { NestFactory } from '@nestjs/core'
import './loadenv'
import { BullQueueModule } from './modules/bull/bull.module'

async function bootstrap() {
  await NestFactory.createApplicationContext(BullQueueModule)
}

bootstrap()
