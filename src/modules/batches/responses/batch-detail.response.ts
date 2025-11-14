export class BatchTimelineItemDto {
  id: string
  event_type: string
  label: string
  at: string | null
  actor_org_name: string | null
  tx_hash: string | null
}

export class BatchDetailResponseDto {
  id: string
  batch_code: string | null
  status: string
  closed: boolean

  onchain_batch_id: number | null
  onchain_synced: boolean

  initial_data_hash: string
  metadata_uri: string | null

  product: {
    id: string
    name: string
    category: string | null
    origin: string | null
    producer_name: string | null
    image_url: string | null
  }

  creator_org: {
    id: string
    name: string
  } | null

  current_owner: {
    id: string
    name: string
  } | null

  code: {
    batch_code: string
    batch_code_hash: string
    qr_image_url: string | null
  } | null

  merkle_root: {
    root_hash: string
    tx_hash: string | null
    block_number: number | null
    created_at: string
  } | null

  timeline: BatchTimelineItemDto[]

  created_at: string
  updated_at: string
}
