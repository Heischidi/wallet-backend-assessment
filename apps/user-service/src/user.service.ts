import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Logger } from 'nestjs-pino';
import { PrismaService } from './prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async createUser(dto: CreateUserDto) {
    // Check for duplicate email
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      this.logger.warn({ msg: 'CreateUser: email already exists', email: dto.email });
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `A user with email '${dto.email}' already exists`,
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
      },
    });

    this.logger.log({ msg: 'User created successfully', userId: user.id, email: user.email });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getUserById(id: string) {
    if (!id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'User ID is required',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      this.logger.warn({ msg: 'GetUserById: user not found', id });
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `User with id '${id}' not found`,
      });
    }

    this.logger.log({ msg: 'User fetched successfully', userId: user.id });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
