import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.createDemoUser();
  }

  private async createDemoUser() {
    const demoEmail = 'demo@demo.com';
    const existingDemoUser = await this.usersRepository.findOneBy({
      email: demoEmail,
    });

    if (!existingDemoUser) {
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      const demoUser = this.usersRepository.create({
        email: demoEmail,
        password: hashedPassword,
        role: 'demo',
        credits: 100,
      });
      await this.usersRepository.save(demoUser);
      this.logger.log('✅ Demo user created successfully');
    }
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    await this.usersRepository.save(user);
    return this.generateToken(user);
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.usersRepository.findOneBy({
      email: loginUserDto.email,
    });
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  async addCredits(userId: number, amount: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('用户不存在');
    }
    user.credits += amount;
    await this.usersRepository.save(user);
    return user;
  }

  async deductCredits(userId: number, amount: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('用户不存在');
    }
    if (user.credits < amount) {
      throw new Error('积分不足');
    }
    user.credits -= amount;
    await this.usersRepository.save(user);
    return user;
  }
}
