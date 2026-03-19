import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { Bet } from '../games/entities/bet.entity';
import { Transaction } from '../wallet/entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bet, Transaction]), UsersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
