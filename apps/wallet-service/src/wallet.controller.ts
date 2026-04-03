import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { WalletService } from './wallet.service';
import { CreateWalletDto, GetWalletDto, CreditWalletDto, DebitWalletDto } from './dto/wallet.dto';

@Controller()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly logger: Logger,
  ) {}

  @GrpcMethod('WalletService', 'CreateWallet')
  async createWallet(data: CreateWalletDto) {
    this.logger.log({ msg: 'CreateWallet RPC called', userId: data.userId });
    return this.walletService.createWallet(data.userId);
  }

  @GrpcMethod('WalletService', 'GetWallet')
  async getWallet(data: GetWalletDto) {
    this.logger.log({ msg: 'GetWallet RPC called', userId: data.userId });
    return this.walletService.getWallet(data.userId);
  }

  @GrpcMethod('WalletService', 'CreditWallet')
  async creditWallet(data: CreditWalletDto) {
    this.logger.log({ msg: 'CreditWallet RPC called', userId: data.userId, amount: data.amount });
    return this.walletService.creditWallet(data.userId, data.amount);
  }

  @GrpcMethod('WalletService', 'DebitWallet')
  async debitWallet(data: DebitWalletDto) {
    this.logger.log({ msg: 'DebitWallet RPC called', userId: data.userId, amount: data.amount });
    return this.walletService.debitWallet(data.userId, data.amount);
  }
}
