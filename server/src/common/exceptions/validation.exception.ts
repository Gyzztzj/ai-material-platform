import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(
    message: string = '参数验证失败',
    details?: unknown,
  ) {
    super(
      {
        message,
        details,
        code: 'VALIDATION_ERROR',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
