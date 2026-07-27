import { DataSource } from 'typeorm';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'dms_user',
  password: process.env.DATABASE_PASSWORD || 'dms_password',
  database: process.env.DATABASE_NAME || 'dms_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../domain/entities/*.ts')],
  migrations: [path.join(__dirname, '../../migrations/*.ts')],
  subscribers: [path.join(__dirname, '../infrastructure/subscribers/*.ts')],
});
