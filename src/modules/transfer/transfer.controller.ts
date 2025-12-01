import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { TransferService } from './transfer.service'

@ApiTags('transfer')
@Controller('transfer')
@ApiBearerAuth()
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post(':id/transfer')
  async transferBatch(
    @Param('id') batchId: string,
    @Body() dto: { to_org_id: string; note?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any
    return this.transferService.transferBatch(batchId, dto, user)
  }

  @Get('incoming')
  async getIncoming(@Req() req: Request) {
    const user = req.user as any
    return this.transferService.getIncomingTransfers(user)
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any
    return this.transferService.acceptTransfer(id, user)
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any
    return this.transferService.rejectTransfer(id, user)
  }
}
