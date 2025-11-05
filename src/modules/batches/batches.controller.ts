import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { BatchesService } from './batches.service'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreateBatchDto } from './dto/create-batch.dto'
import { Request } from 'express'

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  getAllBatches() {
    return this.batchesService.findAll()
  }

  @Post('/create')
  @ApiOperation({ summary: 'Create new batch for a product' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  createBatch(@Body() dto: CreateBatchDto, @Req() req: Request) {
    return this.batchesService.createBatchOnchain(dto, req.user)
  }
}
