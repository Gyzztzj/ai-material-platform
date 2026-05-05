import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const logger = new Logger('HttpExceptionFilter');

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message = '服务器内部错误';
    let details: unknown = null;
    let errorCode: string | null = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as any;
      message = resp.message || message;
      details = resp.details || null;
      errorCode = resp.code || null;
    }

    response.status(status).json({
      code: errorCode || status,
      message,
      data: null,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
