import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Logger } from 'ethers/lib/utils'
import { BatchEntity } from './entities/batches.entity'
import { Repository } from 'typeorm'

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name)
  constructor(
    @InjectRepository(BatchEntity)
    private readonly batchRepo: Repository<BatchEntity>,
  ) {}

  async upsert(data: Partial<BatchEntity>): Promise<BatchEntity> {
    const existing = await this.batchRepo.findOne({
      where: { batch_code: data.batch_code },
    })

    if (existing) {
      const updated = Object.assign(existing, data)
      this.logger.debug(`Updated batch ${data.batch_code}`)
      return this.batchRepo.save(updated)
    }

    const newBatch = this.batchRepo.create(data)
    return this.batchRepo.save(newBatch)
  }

  async updateByOnchainId(onchainId: number, updates: Partial<BatchEntity>) {
    const batch = await this.batchRepo.findOne({
      where: { onchain_batch_id: onchainId },
    })

    if (!batch) {
      this.logger.warn(`Batch with onchain ID ${onchainId} not found`)
      return null
    }

    Object.assign(batch, updates)
    return this.batchRepo.save(batch)
  }
}
