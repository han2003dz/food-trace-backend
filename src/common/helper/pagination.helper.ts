import { SelectQueryBuilder } from 'typeorm'
import { PaginateQuery } from 'nestjs-paginate'

type SortOrder = 'ASC' | 'DESC'

export function applyFiltersAndSort<T>(
  queryBuilder: SelectQueryBuilder<T>,
  query: PaginateQuery,
  alias: string,
) {
  if (!query.filter) query.filter = {}

  Object.keys(query).forEach((key) => {
    if (key.startsWith('filter.')) {
      const filterKey = key.replace('filter.', '')
      query.filter[filterKey] = query[key]
    }
  })

  if (query.sortBy) {
    const sortStr = query.sortBy.toString()
    let [field, order] = sortStr.split(':')
    if (order !== 'ASC' && order !== 'DESC') {
      order = 'DESC'
      field = field
    }
    queryBuilder.addOrderBy(
      `${alias}.${field}`,
      order.toUpperCase() as SortOrder,
    )
  }

  return queryBuilder
}
