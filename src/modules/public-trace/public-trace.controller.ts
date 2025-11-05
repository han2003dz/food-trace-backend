import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { PublicTraceService } from './public-trace.service'
import { Public } from '@app/metadata/public.metadata'

@ApiTags('Public Trace API')
@Controller('public-trace')
export class PublicTraceController {
  constructor(private readonly publicTraceService: PublicTraceService) {}

  @Get('/:batch_code')
  @Public()
  @ApiOperation({ summary: 'Public traceability detail by batch code' })
  getTrace(@Param('batch_code') batch_code: string) {
    return this.publicTraceService.getPublicTrace(batch_code)
  }
}
