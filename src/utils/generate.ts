import { BadRequestException } from '@nestjs/common'
import dayjs from 'dayjs'

export function generateBatchCode(
  productName: string,
  location: string,
  sequence: number,
) {
  if (!productName || !location)
    throw new BadRequestException(
      'Product name and location required to generate batchCode',
    )
  const productSlug = productName.replace(/\s+/g, '-').toUpperCase()
  const locSlug = location.replace(/\s+/g, '-').toUpperCase()
  const year = dayjs().format('YYYY')
  const seq = String(sequence).padStart(3, '0')

  return `LOT-${productSlug}-${locSlug}-${year}-${seq}`
}
