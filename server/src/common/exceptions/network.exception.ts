import { HttpException, HttpStatus } from '@nestjs/common';

export class NetworkException extends HttpException {
  constructor(
    message: string = '网络连接失败，请检查网络设置',
    details?: unknown,
  ) {
    super(
      {
        message,
        details,
        code: 'NETWORK_ERROR',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
