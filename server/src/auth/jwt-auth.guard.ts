/**
 * JWT认证守卫
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('未提供token');
      throw new UnauthorizedException('请先登录');
    }

    try {
      const secret = this.configService.get('JWT_SECRET');
      if (!secret) {
        this.logger.error('JWT_SECRET 未配置');
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secret,
      });
      this.logger.log(`Token验证成功，用户ID: ${payload.sub}`);

      const user = await this.userService.findOne(payload.sub);
      
      if (!user) {
        this.logger.warn('用户不存在');
        throw new UnauthorizedException('用户不存在');
      }

      request.user = user;
    } catch (e) {
      this.logger.error(`Token验证失败: ${e.message}`);
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('无效的token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
