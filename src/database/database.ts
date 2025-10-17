import { config as dotenvConfig } from 'dotenv'
import { DataSource, DataSourceOptions } from 'typeorm'

dotenvConfig({ path: '.env' })

const ENV = process.env.NODE_ENV

const sslConfig =
  process.env.SSL === 'false' || !process.env.SSL
    ? {}
    : {
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities:
    ENV == 'development'
      ? ['dist/src/**/*.entity{.ts,.js}']
      : ['src/**/*.entity{.ts,.js}'],
  logging: false,
  migrations:
    ENV == 'development'
      ? ['dist/src/database/**/migrations/*{.ts,.js}']
      : ['src/database/**/migrations/*{.ts,.js}'],
  synchronize: false,
  ...sslConfig,
}

const dataSource = new DataSource(dataSourceOptions)
export default dataSource
