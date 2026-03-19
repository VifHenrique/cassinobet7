import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet } from '../games/entities/bet.entity';
import { Transaction } from '../wallet/entities/transaction.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Bet) private betRepo: Repository<Bet>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    private usersService: UsersService,
  ) {}

  async getMetrics() {
    const [totalBets, totalUsers] = await Promise.all([
      this.betRepo.count(),
      this.usersService.findAll().then(u => u.length),
    ]);

    const stats = await this.betRepo
      .createQueryBuilder('bet')
      .select('bet.game', 'game')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(bet.amount)', 'totalWagered')
      .addSelect('SUM(bet.payout)', 'totalPaid')
      .addSelect("SUM(CASE WHEN bet.status = 'WIN' THEN 1 ELSE 0 END)", 'wins')
      .groupBy('bet.game')
      .getRawMany();

    return { totalBets, totalUsers, gameStats: stats };
  }

  async getAllBets(limit = 100) {
    return this.betRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAllUsers() {
    return this.usersService.findAll();
  }

  async toggleUser(userId: string) {
    return this.usersService.toggleActive(userId);
  }
}
