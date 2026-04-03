import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

interface GetUserByIdRequest {
  id: string;
}

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: CreateUserDto) {
    this.logger.log({ msg: 'CreateUser RPC called', email: data.email });
    return this.userService.createUser(data);
  }

  @GrpcMethod('UserService', 'GetUserById')
  async getUserById(data: GetUserByIdRequest) {
    this.logger.log({ msg: 'GetUserById RPC called', id: data.id });
    return this.userService.getUserById(data.id);
  }
}
