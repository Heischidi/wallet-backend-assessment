import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { WalletModule } from './wallet.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    WalletModule,
    {
      bufferLogs: true,
      transport: Transport.GRPC,
      options: {
        package: 'wallet',
        protoPath: join(__dirname, '../../../packages/proto/wallet.proto'),
        url: `0.0.0.0:${process.env.PORT || process.env.WALLET_SERVICE_PORT || 5002}`,
      },
    },
  );

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen();
  console.log(`💰 Wallet Service is running on port ${process.env.PORT || process.env.WALLET_SERVICE_PORT || 5002}`);
}

bootstrap();
