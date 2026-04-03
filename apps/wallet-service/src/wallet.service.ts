import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Observable, firstValueFrom } from 'rxjs';
import { Logger } from 'nestjs-pino';
import { PrismaService } from './prisma.service';

interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface UserServiceGrpcClient {
  getUserById(data: { id: string }): Observable<UserResponse>;
}

@Injectable()
export class WalletService implements OnModuleInit {
  private userServiceClient: UserServiceGrpcClient;

  constructor(
    @Inject('USER_SERVICE') private readonly grpcClient: ClientGrpc,
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  onModuleInit() {
    this.userServiceClient =
      this.grpcClient.getService<UserServiceGrpcClient>('UserService');
  }

  private formatWallet(wallet: any) {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: Number(wallet.balance),
      createdAt: wallet.createdAt.toISOString(),
    };
  }

  /**
   * Verify user exists by calling User Service via gRPC.
   * Throws RpcException NOT_FOUND if user doesn't exist.
   */
  private async verifyUserExists(userId: string): Promise<void> {
    try {
      await firstValueFrom(this.userServiceClient.getUserById({ id: userId }));
    } catch (err) {
      this.logger.warn({ msg: 'User verification failed', userId, error: err?.message });
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `User with id '${userId}' not found`,
      });
    }
  }

  async createWallet(userId: string) {
    if (!userId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'userId is required',
      });
    }

    // ✅ Inter-service communication: verify user via gRPC
    await this.verifyUserExists(userId);

    const existing = await this.prisma.wallet.findUnique({ where: { userId } });
    if (existing) {
      this.logger.warn({ msg: 'CreateWallet: wallet already exists', userId });
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: `Wallet for user '${userId}' already exists`,
      });
    }

    const wallet = await this.prisma.wallet.create({
      data: { userId },
    });

    this.logger.log({ msg: 'Wallet created', walletId: wallet.id, userId });
    return this.formatWallet(wallet);
  }

  async getWallet(userId: string) {
    if (!userId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'userId is required',
      });
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      this.logger.warn({ msg: 'GetWallet: wallet not found', userId });
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Wallet for user '${userId}' not found`,
      });
    }

    this.logger.log({ msg: 'Wallet fetched', walletId: wallet.id, userId });
    return this.formatWallet(wallet);
  }

  async creditWallet(userId: string, amount: number) {
    if (!userId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'userId is required',
      });
    }
    if (amount <= 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Amount must be greater than 0',
      });
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Wallet for user '${userId}' not found`,
      });
    }

    const updated = await this.prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });

    this.logger.log({
      msg: 'Wallet credited',
      userId,
      amount,
      newBalance: Number(updated.balance),
    });
    return this.formatWallet(updated);
  }

  async debitWallet(userId: string, amount: number) {
    if (!userId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'userId is required',
      });
    }
    if (amount <= 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Amount must be greater than 0',
      });
    }

    // ✅ Bonus: Prisma $transaction for atomic debit
    const updated = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });

      if (!wallet) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `Wallet for user '${userId}' not found`,
        });
      }

      if (Number(wallet.balance) < amount) {
        this.logger.warn({
          msg: 'Debit failed: insufficient balance',
          userId,
          requested: amount,
          available: Number(wallet.balance),
        });
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: `Insufficient balance. Available: ${wallet.balance}, Requested: ${amount}`,
        });
      }

      return tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });
    });

    this.logger.log({
      msg: 'Wallet debited',
      userId,
      amount,
      newBalance: Number(updated.balance),
    });
    return this.formatWallet(updated);
  }
}
