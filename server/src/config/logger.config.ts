import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logDir = process.env.LOG_DIR || 'logs';
const logLevel = process.env.LOG_LEVEL || 'info';

const dailyRotateFileTransport = new DailyRotateFile({
  filename: `${logDir}/application-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
});

const errorDailyRotateFileTransport = new DailyRotateFile({
  level: 'error',
  filename: `${logDir}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, context, trace }) => {
      return `${timestamp} [${level}]${context ? ` [${context}]` : ''}: ${message}${trace ? `\n${trace}` : ''}`;
    }),
  ),
});

export const winstonConfig: WinstonModuleOptions = {
  level: logLevel,
  transports: [
    dailyRotateFileTransport,
    errorDailyRotateFileTransport,
    consoleTransport,
  ],
};
