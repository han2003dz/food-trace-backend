import { Controller, Get, Query } from '@nestjs/common'
import { OnchainEventService } from './onchain-events.service'

@Controller('onchain_events')
export class OnchainEventsController {
  constructor(private readonly onchainEventsService: OnchainEventService) {}

  @Get()
  getEventsByProduct(@Query('product_id') productId?: string) {
    if (productId) return this.onchainEventsService.findByProductId(productId)
    return this.onchainEventsService.findAll()
  }
}
