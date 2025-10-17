import { FilterOperator, PaginateConfig } from 'nestjs-paginate'
import { User } from '../entities/user.entity'

export const userPaginateConfig: PaginateConfig<User> = {
  sortableColumns: ['createdAt', 'updatedAt'],
  searchableColumns: ['wallet_address'],
  defaultSortBy: [['createdAt', 'DESC']],
  filterableColumns: {
    role: [FilterOperator.IN],
  },
  defaultLimit: 10,
}
