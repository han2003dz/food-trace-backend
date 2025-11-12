import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { BatchesService } from './batches.service'
import { CreateBatchDto } from './dto/create-batch.dto'

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
  async createBatch(@Body() dto: CreateBatchDto) {
    return this.batchesService.createBatchOnchain(dto)
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
}
