export interface EnvironmentVariables {
  PORT: number;
  LOG_LEVEL: string;
  LOG_DIR: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  DATABASE_URL: string;
  DATABASE_SSL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_DB: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  TONGYI_API_KEY: string;
  DOUBAI_API_KEY: string;
  REMOVE_BG_API_KEY: string;
}

export default (): EnvironmentVariables => ({
  PORT: parseInt(process.env.PORT || '3000', 10) || 300,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_DIR: process.env.LOG_DIR || 'logs',
  POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
  POSTGRES_DB: process.env.POSTGRES_DB || 'ai-material-db',
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432', 10) || 5432,
  DATABASE_URL: process.env.DATABASE_URL || '',
  DATABASE_SSL: process.env.DATABASE_SSL || 'false',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10) || 0,
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  TONGYI_API_KEY: process.env.TONGYI_API_KEY || process.env.QWEN_API_KEY || '',
  DOUBAI_API_KEY: process.env.DOUBAI_API_KEY || '',
  REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY || '',
});
