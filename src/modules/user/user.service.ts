import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { paginate, PaginateQuery } from 'nestjs-paginate'
import { userPaginateConfig } from './config/user.paginate'
import getLast6Chars from '@app/utils/format'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
    })
  }
  private readonly logger = new Logger(UserService.name)

  async findOneBy(conditions: Record<any, any>): Promise<User> {
    return this.userRepository.findOneBy(conditions)
  }

  async findOneByWalletAddress(wallet_address: string): Promise<User> {
    return this.userRepository.findOne({
      where: { wallet_address },
    })
  }

  async firstOrCreate(wallet_address: string) {
    let user = await this.findOneByWalletAddress(wallet_address)
    const username = getLast6Chars(wallet_address)
    if (!user) {
      user = this.userRepository.create({
        wallet_address: wallet_address,
        username,
        role: 'USER',
      })
      await this.userRepository.save(user)
    }

    return user
  }

  genAffiliateCode(length: number): string {
    const chars =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    const affiliateCode = [...crypto.getRandomValues(new Uint8Array(length))]
      .map((x) => chars[x % chars.length])
      .join('')
    return affiliateCode
  }

  async getMyProfile(user: User): Promise<User> {
    return this.userRepository.findOne({
      where: { id: user.id },
    })
  }

  async updateInformation(userId: string, information: Record<string, any>) {
    await this.userRepository.update(userId, { ...information })
    return this.userRepository.findOne({ where: { id: userId } })
  }

  findAll(query: PaginateQuery) {
    return paginate<User>(query, this.userRepository, userPaginateConfig)
  }

  async updateUsername(userId: string, username: string) {
    const existedUser = await this.userRepository.findOne({
      where: { username },
    })
    if (existedUser && existedUser.id !== userId)
      throw new BadRequestException('Username already exists')
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) throw new BadRequestException('User not found')
    user.username = username
    await this.userRepository.save(user)
    return user
  }
}
