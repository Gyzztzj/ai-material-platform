import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip || request.connection.remoteAddress;

    const logData = {
      method,
      url,
      body,
      query,
      params,
      userAgent,
      ip,
    };

    this.logger.log(`Request: ${method} ${url}`, JSON.stringify(logData));

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const delay = Date.now() - now;

          this.logger.log(
            `Response: ${method} ${url} - Status: ${statusCode} - Duration: ${delay}ms`,
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          const statusCode = error.status || 500;

          this.logger.error(
            `Error: ${method} ${url} - Status: ${statusCode} - Duration: ${delay}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
