import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty({ message: 'userId is required' })
  userId: string;
}

export class GetWalletDto {
  @IsString()
  @IsNotEmpty({ message: 'userId is required' })
  userId: string;
}

export class CreditWalletDto {
  @IsString()
  @IsNotEmpty({ message: 'userId is required' })
  userId: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be greater than 0' })
  amount: number;
}

export class DebitWalletDto {
  @IsString()
  @IsNotEmpty({ message: 'userId is required' })
  userId: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be greater than 0' })
  amount: number;
}
