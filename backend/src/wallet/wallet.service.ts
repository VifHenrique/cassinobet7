import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async getBalance(userId: string): Promise<{ balance: number }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return { balance: parseFloat(user.balance as any) };
  }

  async debit(userId: string, amount: number, description: string, reference?: string): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      // Lock user row to prevent race conditions
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      const balance = parseFloat(user.balance as any);
      if (balance < amount) throw new BadRequestException('Insufficient balance');

      const newBalance = parseFloat((balance - amount).toFixed(2));
      await manager.update(User, userId, { balance: newBalance });

      const tx = manager.create(Transaction, {
        userId,
        type: TransactionType.BET,
        amount,
        balanceBefore: balance,
        balanceAfter: newBalance,
        description,
        reference,
      });
      return manager.save(Transaction, tx);
    });
  }

  async credit(userId: string, amount: number, type: TransactionType, description: string, reference?: string): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      const balance = parseFloat(user.balance as any);
      const newBalance = parseFloat((balance + amount).toFixed(2));
      await manager.update(User, userId, { balance: newBalance });

      const tx = manager.create(Transaction, {
        userId,
        type,
        amount,
        balanceBefore: balance,
        balanceAfter: newBalance,
        description,
        reference,
      });
      return manager.save(Transaction, tx);
    });
  }

  async getHistory(userId: string, limit = 50): Promise<Transaction[]> {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
