export interface UserParameter {
  parameter: number
  value: number
}

export interface UserEventData {
  userAddress: string
  level: number
  reputation: number
  parameterCount: number
  parameters: UserParameter[]
}

export interface UserAvatar {
  parameter: number
  id: string
}
