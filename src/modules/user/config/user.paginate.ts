import { FilterOperator, PaginateConfig } from 'nestjs-paginate'
import { User } from '../entities/user.entity'

export const userPaginateConfig: PaginateConfig<User> = {
  sortableColumns: ['created_at', 'updated_at'],
  searchableColumns: ['wallet_address'],
  defaultSortBy: [['created_at', 'DESC']],
  filterableColumns: {
    role: [FilterOperator.IN],
  },
  defaultLimit: 10,
}
