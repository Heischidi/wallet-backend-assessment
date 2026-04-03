import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      },
    }),
    // Register gRPC client for User Service
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(__dirname, '../../../packages/proto/user.proto'),
          url: process.env.USER_SERVICE_URL || 'localhost:5001',
        },
      },
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService, PrismaService],
})
export class WalletModule {}
