export enum BatchEventType {
  CREATED = 'CREATED',
  PROCESSED = 'PROCESSED',
  SHIPPED = 'SHIPPED',
  RECEIVED = 'RECEIVED',
  STORED = 'STORED',
  SOLD = 'SOLD',
  RECALLED = 'RECALLED',
  CUSTOM = 'CUSTOM',
}

export enum BatchStatus {
  HARVESTED = 'HARVESTED',
  PROCESSED = 'PROCESSED',
  IN_TRANSIT = 'IN_TRANSIT',
  WAREHOUSE = 'WAREHOUSE',
  SOLD = 'SOLD',
  RECALLED = 'RECALLED',
}

// Map event_type (string) → index enum EventType in contract
// enum EventType { Created(0), Processed(1), Shipped(2), Received(3), Stored(4), Sold(5), Recalled(6), Custom(7) }
export const EventTypeToOnchainIndex: Record<BatchEventType, number> = {
  [BatchEventType.CREATED]: 0,
  [BatchEventType.PROCESSED]: 1,
  [BatchEventType.SHIPPED]: 2,
  [BatchEventType.RECEIVED]: 3,
  [BatchEventType.STORED]: 4,
  [BatchEventType.SOLD]: 5,
  [BatchEventType.RECALLED]: 6,
  [BatchEventType.CUSTOM]: 7,
}

export const OnchainIndexToEventType: Record<number, BatchEventType> = {
  0: BatchEventType.CREATED,
  1: BatchEventType.PROCESSED,
  2: BatchEventType.SHIPPED,
  3: BatchEventType.RECEIVED,
  4: BatchEventType.STORED,
  5: BatchEventType.SOLD,
  6: BatchEventType.RECALLED,
  7: BatchEventType.CUSTOM,
}
