import { Injectable, Logger } from '@nestjs/common'
import { ethers } from 'ethers'
import foodTraceArtifact from '../contracts/TraceabilityMerkleRegistry.json'
import { ParsedEvent } from '../types/parsed-event.type'

@Injectable()
export class EventParserService {
  private readonly iface = new ethers.utils.Interface(foodTraceArtifact.abi)
  private readonly logger = new Logger(EventParserService.name)

  parse(log: ethers.providers.Log): ParsedEvent | null {
    try {
      const parsed = this.iface.parseLog(log)
      return {
        event_name: parsed.name,
        contract_address: log.address,
        block_number: log.blockNumber,
        tx_hash: log.transactionHash,
        args: parsed.args,
      }
    } catch (e) {
      this.logger.error(`❌ Failed to parse log: ${e.message}`)
      return null
    }
  }
}
