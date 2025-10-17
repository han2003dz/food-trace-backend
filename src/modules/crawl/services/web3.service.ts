import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ethers } from 'ethers'
import m87Artifact from '../contracts/M87Contract.json'
import { UserEventData } from '../../../modules/user/types/user.interface'

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
      m87Artifact.abi,
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
    const data: UserEventData[] = []
    logs.forEach((log) => {
      const [userAddress, level, reputation, parameterCount] = log.args
      const eventData: UserEventData = {
        userAddress,
        level: level.toNumber(),
        reputation: reputation.toNumber(),
        parameterCount: parameterCount.toNumber(),
        parameters: [],
      }
      const parameters = []
      for (let i = 0; i < log.args[4].length; i++) {
        parameters.push({
          parameter: log.args[4][i].parameter.toNumber(),
          value: log.args[4][i].value.toNumber(),
        })
      }
      eventData.parameters = parameters
      data.push(eventData)
    })
    return data
  }
}
