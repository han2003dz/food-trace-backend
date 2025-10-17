import { TOKENS } from './../common/constant/bull-queue.constant'

export default function getDecimal(currency: string): number {
  const token = TOKENS.filter((el) => el.currency === currency)[0]
  return token.decimal
}
