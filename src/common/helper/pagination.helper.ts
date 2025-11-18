import { SelectQueryBuilder } from 'typeorm'
import { PaginateQuery } from 'nestjs-paginate'

export function applyFiltersAndSort<T>(
  qb: SelectQueryBuilder<T>,
  query: PaginateQuery,
  alias: string,
) {
  // ensure filter object exists
  if (!query.filter) query.filter = {}

  // Extract filter.status, filter.xxx from query
  Object.keys(query).forEach((key) => {
    if (key.startsWith('filter.')) {
      const filterKey = key.replace('filter.', '')
      query.filter[filterKey] = query[key]
    }
  })

  Object.entries(query.filter).forEach(([field, value]) => {
    qb.andWhere(`${alias}.${field} = :${field}`, { [field]: value })
  })

  return qb
}
