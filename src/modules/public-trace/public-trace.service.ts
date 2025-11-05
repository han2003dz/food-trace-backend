import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ethers } from 'ethers'
import { BatchEntity } from '../batches/entities/batches.entity'
import { ConfigService } from '@nestjs/config'
import { Repository } from 'typeorm'
import foodTraceArtifact from '../crawl/contracts/TraceabilityMerkleRegistry.json'
@Injectable()
export class PublicTraceService {
  private readonly contract: ethers.Contract
  private readonly wallet: ethers.Wallet
  constructor(
    @InjectRepository(BatchEntity)
    private readonly batchRepo: Repository<BatchEntity>,
    private readonly configService: ConfigService,
  ) {
    const rpc = this.configService.get<string>('RPC_URL')
    const pk = this.configService.get<string>('COMMITTER_PRIVATE_KEY')
    const contractAddress = this.configService.getOrThrow<string>(
      'config.contractAddress',
    )

    const provider = new ethers.providers.JsonRpcProvider(rpc)
    this.wallet = new ethers.Wallet(pk, provider)
    this.contract = new ethers.Contract(
      contractAddress,
      foodTraceArtifact.abi,
      this.wallet,
    )
  }

  async getPublicTrace(batch_code: string) {
    const batch = await this.batchRepo.findOne({
      where: { batch_code },
      relations: ['product', 'created_by'],
    })

    if (!batch) throw new NotFoundException('Batch not found')

    let verified = false
    let onchainRoot: string | null = null

    try {
      const onchain = await this.contract.batches(batch.onchain_batch_id)
      onchainRoot = onchain.root
      verified = onchainRoot === batch.metadata?.merkleRoot

      return {
        batch_code,
        verified,
        onchain_root: onchainRoot,
        tx_hash: batch.metadata?.tx_hash,
        merkle_root: batch.metadata?.merkleRoot,
        product: batch.product,
        created_by: batch.metadata.createdBy,
        status: batch.status,
        metadata: batch.metadata,
        created_at: batch.created_at,
      }
    } catch (err) {
      console.error('Error verifying on-chain root:', err)
    }
  }
}
