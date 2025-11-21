import { BatchEventType } from '@app/common/enums/batch.enum'
import { BatchEntity } from '../entities/batches.entity'

export interface BatchTimelineItem {
  id: string
  event_type: BatchEventType | string
  label: string
  at: string | null
  actor_org_name: string | null
  tx_hash: string | null
}

export interface BatchDetail {
  batch: BatchEntity
  timeline: BatchTimelineItem[]
}
