import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    message: string = 'API请求失败',
    statusCode: number = HttpStatus.BAD_GATEWAY,
    details?: unknown,
  ) {
    super(
      {
        message,
        details,
        code: 'API_ERROR',
      },
      statusCode,
    );
  }
}
