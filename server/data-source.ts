import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [resolve(process.cwd(), 'src/**/*.entity.ts')],
  migrations: [resolve(process.cwd(), 'src/database/migrations/*.ts')],
});