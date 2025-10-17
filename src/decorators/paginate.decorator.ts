import { applyDecorators } from '@nestjs/common'
import { ApiQuery } from '@nestjs/swagger'

export function PaginateQueryOptions() {
  return applyDecorators(
    ApiQuery({ name: 'page', required: false }),
    ApiQuery({ name: 'limit', required: false }),
    ApiQuery({ name: 'search', required: false }),
    ApiQuery({ name: 'sortBy', required: false }),
    ApiQuery({ name: 'filter', required: false }),
  )
}
