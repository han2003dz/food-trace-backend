import { Injectable, Logger } from '@nestjs/common'
import { ethers } from 'ethers'
import foodTraceArtifact from '../contracts/TraceabilityMerkleRegistry.json'

@Injectable()
export class EventParserService {
  private readonly iface = new ethers.utils.Interface(foodTraceArtifact.abi)
  private readonly logger = new Logger(EventParserService.name)

  parse(log: ethers.Event): Record<string, any> {
    try {
      const parsed = this.iface.parseLog(log)
      const args: Record<string, any> = {}
      parsed.eventFragment.inputs.forEach((input, i) => {
        args[input.name] = parsed.args[i].toString?.() ?? parsed.args[i]
      })

      return {
        event_name: parsed.name,
        args,
        tx_hash: log.transactionHash,
        block_number: log.blockNumber,
        contract_address: log.address,
      }
    } catch (e) {
      this.logger.error(`❌ Failed to parse log: ${e.message}`)
      return null
    }
  }
}
