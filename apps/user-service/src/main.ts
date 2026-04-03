import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { UserModule } from './user.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      bufferLogs: true,
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath: join(__dirname, '../../../packages/proto/user.proto'),
        url: `0.0.0.0:${process.env.PORT || process.env.USER_SERVICE_PORT || 5001}`,
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
  console.log(`🚀 User Service is running on port ${process.env.PORT || process.env.USER_SERVICE_PORT || 5001}`);
}

bootstrap();
