import 'dotenv/config'
import dataSource from '../database'
import { Client } from 'pg'
import { ROLE } from '../../common/enums/user-role'

async function seedSuperAdmin(client: Client) {
  const wallet_address = process.env.SUPER_ADMIN_ADDRESS
  if (!wallet_address) {
    throw new Error('SUPER_ADMIN_ADDRESS is not set in .env')
  }
  const exists = await client.query(
    'SELECT id FROM users WHERE wallet_address = $1',
    [wallet_address],
  )
  if (exists.rows.length > 0) {
    console.log('Super admin already exists.')
    return
  }
  await client.query(
    `INSERT INTO users (wallet_address, role, created_at, updated_at) VALUES ($1, $2, now(), now())`,
    [wallet_address, ROLE.ADMIN],
  )
  console.log('Super admin seeded.')
}

export async function seed() {
  await dataSource.initialize()

  const queryRunner = dataSource.createQueryRunner()
  await queryRunner.connect()

  await queryRunner.startTransaction()

  try {
    const client = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: process.env.SSL === 'true',
    })
    await client.connect()
    await seedSuperAdmin(client)
    // ...add other seeders here if needed...
    await client.end()

    await queryRunner.commitTransaction()
  } catch (error) {
    console.log('Error seeder: ', error)
    await queryRunner.rollbackTransaction()
  } finally {
    await queryRunner.release()
  }
}

seed().catch(() => {
  process.exit(1)
})
