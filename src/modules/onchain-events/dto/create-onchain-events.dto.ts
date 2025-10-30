export class CreateOnchainEventDto {
  event_name: string
  args: Record<string, any>
  tx_hash: string
  block_number: number
  contract_address: string
}
