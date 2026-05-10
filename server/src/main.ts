import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as express from 'express';
import * as path from 'path';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const configService = app.get(ConfigService);

  // 全局路由前缀
  app.setGlobalPrefix('api');

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const messages = errors.map(
          (error) =>
            `${error.property}：${Object.values(error.constraints || {}).join(', ')}`,
        );
        return new BadRequestException(messages.join('; '));
      },
    }),
  );

  // 全局拦截器
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS配置
  app.enableCors();

  // 接口限流
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP最多100个请求
    message: '请求过于频繁，请稍后再试',
  });
  app.use(limiter);

  // 静态文件服务（不使用 /api 前缀）
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Swagger API文档
  const config = new DocumentBuilder()
    .setTitle('AI素材平台API')
    .setDescription('AI素材平台的API文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  app
    .get(WINSTON_MODULE_NEST_PROVIDER)
    .log(`✅服务启动成功， running on: ${await app.getUrl()}`);
}
bootstrap();
