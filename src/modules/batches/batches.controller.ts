import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { BatchesService } from './batches.service'
import { CreateBatchDto } from './dto/create-batch.dto'
import { Request } from 'express'
import { Public } from '@app/metadata/public.metadata'

@ApiTags('Batches')
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all batches' })
  @ApiResponse({
    status: 200,
    description: 'List of batches retrieved successfully',
  })
  async getAllBatches() {
    return this.batchesService.findAll()
  }

  @Post('/create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new batch for a product and sync on-chain' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or transaction reverted',
  })
  async createBatch(@Body() dto: CreateBatchDto, @Req() req: Request) {
    return this.batchesService.createBatchOnchain(dto, req.user)
  }

  @Post('/:onchainBatchId/event')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record trace event for a batch on-chain' })
  @ApiResponse({
    status: 200,
    description: 'Trace event recorded successfully',
  })
  async recordTraceEvent(
    @Param('onchainBatchId') onchainBatchId: number,
    @Body()
    body: {
      eventType: number
      eventHash: string
    },
  ) {
    const { eventType, eventHash } = body
    return this.batchesService.recordTraceEvent(
      onchainBatchId,
      eventType,
      eventHash,
    )
  }

  @Post('/:onchainBatchId/commit')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Commit Merkle root for a batch' })
  @ApiResponse({
    status: 200,
    description: 'Merkle root committed successfully',
  })
  async commitMerkleRoot(
    @Param('onchainBatchId') onchainBatchId: number,
    @Body() body: { merkleRoot: string },
  ) {
    const { merkleRoot } = body
    return this.batchesService.commitMerkleRoot(onchainBatchId, merkleRoot)
  }

  @Get('/my')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get batch by user' })
  @ApiResponse({
    status: 200,
    description: 'Get batch by user successfully',
  })
  async getBatchByUser(@Req() req: Request) {
    return this.batchesService.getBatchByUser(req.user)
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get batch detail with product, QR, merkle, timeline',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch detail fetched successfully',
  })
  getBatchDetail(@Param('id') id: string) {
    return this.batchesService.getBatchDetail(id)
  }
}
