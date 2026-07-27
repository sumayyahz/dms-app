import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    name: process.env.APP_NAME || 'DMS',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000'),
  },
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    path: process.env.STORAGE_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'),
  },
  minio: {
    enabled: process.env.MINIO_ENABLED === 'true',
    endpoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT || '9000'),
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET_NAME || 'dms-documents',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
  ocr: {
    enabled: process.env.OCR_ENABLED === 'true',
    pdfExtractionEnabled: process.env.PDF_EXTRACTION_ENABLED === 'true',
  },
  openai: {
    enabled: process.env.OPENAI_ENABLED === 'true',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  },
};
