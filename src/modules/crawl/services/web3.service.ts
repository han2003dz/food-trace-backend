import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ethers } from 'ethers'
import foodTraceArtifact from '../contracts/TraceabilityMerkleRegistry.json'

@Injectable()
export class Web3Service {
  constructor(private readonly configService: ConfigService) {
    this.provider = new ethers.providers.JsonRpcProvider(
      this.configService.getOrThrow<string>('config.evmRpcUrl'),
    )
    const contractAddress = this.configService.getOrThrow<string>(
      'config.contractAddress',
    )
    this.contract = new ethers.Contract(
      contractAddress,
      foodTraceArtifact.abi,
      this.provider,
    )
    this.logger.log(
      `Web3Service initialized with contract at ${contractAddress}`,
    )
  }
  private provider: ethers.providers.JsonRpcProvider
  private contract: ethers.Contract
  private readonly logger = new Logger(Web3Service.name)

  async getLatestBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber()
  }

  async getEventLogs(fromBlock: number, toBlock: number, eventName: string) {
    const filter = this.contract.filters[eventName]()
    const logs = await this.contract.queryFilter(filter, fromBlock, toBlock)
    this.logger.log(
      `📦 [${eventName}] ${logs.length} logs from ${fromBlock} → ${toBlock}`,
    )
    return logs
  }
}
