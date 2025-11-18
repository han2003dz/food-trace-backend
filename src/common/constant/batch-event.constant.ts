import { BatchEventType } from '../enums/batch.enum'

export const BatchEventMap: Record<number, string> = {
  0: 'CREATED',
  1: 'PROCESSED',
  2: 'SHIPPED',
  3: 'RECEIVED',
  4: 'STORED',
  5: 'SOLD',
  6: 'RECALLED',
}

export const EventTypeToOnchainIndex: Record<BatchEventType, number> = {
  [BatchEventType.CREATED]: 0,
  [BatchEventType.PROCESSED]: 1,
  [BatchEventType.SHIPPED]: 2,
  [BatchEventType.RECEIVED]: 3,
  [BatchEventType.STORED]: 4,
  [BatchEventType.SOLD]: 5,
  [BatchEventType.RECALLED]: 6,
}
