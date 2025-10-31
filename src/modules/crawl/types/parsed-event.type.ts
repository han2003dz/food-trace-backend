import { BigNumberish } from 'ethers'
export interface ParsedEvent {
  event_name: string

  contract_address: string

  block_number: number

  tx_hash: string

  tx_from?: string

  block_timestamp?: Date

  args: Record<string, any> & {
    batchCode?: string
    batchCodeHash?: string
    batchId?: BigNumberish
    committer?: string

    merkleRoot?: string
    fromEventId?: BigNumberish
    toEventId?: BigNumberish

    oldCommitter?: string
    newCommitter?: string
  }
}
