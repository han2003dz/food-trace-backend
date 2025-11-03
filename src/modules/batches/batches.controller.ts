import { Body, Controller, Get, Post } from '@nestjs/common'
import { BatchesService } from './batches.service'

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  getAllBatches() {
    return this.batchesService.findAll()
  }

  @Post()
  createBatch(@Body() body: any) {
    const result = this.batchesService.createBatchOnchain(body)
    return {
      message: 'Batch creation submitted on-chain',
      result,
    }
  }
}
