import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { Bet, GameType, BetStatus } from '../entities/bet.entity';
import { WalletService } from '../../wallet/wallet.service';
import { TransactionType } from '../../wallet/entities/transaction.entity';

export const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
export const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

export type BetType = 'number' | 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'col1' | 'col2' | 'col3';

export interface RouletteBet {
  type: BetType;
  value?: number;
  amount: number;
}

@Injectable()
export class RouletteService {
  constructor(
    @InjectRepository(Bet)
    private betRepo: Repository<Bet>,
    private walletService: WalletService,
  ) {}

  spin(): number {
    return randomInt(0, 37); // 0–36
  }

  getColor(n: number): string {
    if (n === 0) return 'green';
    return RED_NUMBERS.includes(n) ? 'red' : 'black';
  }

  calculateWinnings(number: number, bets: RouletteBet[]): number {
    let total = 0;
    const color = this.getColor(number);

    for (const bet of bets) {
      let win = false;
      let multiplier = 1;

      switch (bet.type) {
        case 'number':
          win = bet.value === number;
          multiplier = 35;
          break;
        case 'red':
          win = color === 'red';
          multiplier = 1;
          break;
        case 'black':
          win = color === 'black';
          multiplier = 1;
          break;
        case 'even':
          win = number !== 0 && number % 2 === 0;
          multiplier = 1;
          break;
        case 'odd':
          win = number % 2 !== 0;
          multiplier = 1;
          break;
        case 'low':
          win = number >= 1 && number <= 18;
          multiplier = 1;
          break;
        case 'high':
          win = number >= 19 && number <= 36;
          multiplier = 1;
          break;
        case 'dozen1':
          win = number >= 1 && number <= 12;
          multiplier = 2;
          break;
        case 'dozen2':
          win = number >= 13 && number <= 24;
          multiplier = 2;
          break;
        case 'dozen3':
          win = number >= 25 && number <= 36;
          multiplier = 2;
          break;
        case 'col1':
          win = number % 3 === 1;
          multiplier = 2;
          break;
        case 'col2':
          win = number % 3 === 2;
          multiplier = 2;
          break;
        case 'col3':
          win = number % 3 === 0 && number !== 0;
          multiplier = 2;
          break;
      }

      if (win) total += bet.amount * (multiplier + 1);
    }
    return total;
  }

  async placeBetsAndSpin(userId: string, bets: RouletteBet[]) {
    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);

    // Debit total bet
    await this.walletService.debit(userId, totalBet, 'Roulette bets');

    const number = this.spin();
    const color = this.getColor(number);
    const payout = this.calculateWinnings(number, bets);
    const isWin = payout > 0;
    const profit = parseFloat((payout - totalBet).toFixed(2));

    if (payout > 0) {
      await this.walletService.credit(
        userId, payout,
        TransactionType.WIN,
        `Roulette win - number ${number}`,
      );
    }

    const savedBet = this.betRepo.create({
      userId,
      game: GameType.ROULETTE,
      amount: totalBet,
      payout,
      multiplier: isWin ? payout / totalBet : 0,
      status: isWin ? BetStatus.WIN : BetStatus.LOSS,
      gameData: { bets },
      result: { number, color, payout, profit },
    });
    await this.betRepo.save(savedBet);

    const wallet = await this.walletService.getBalance(userId);

    return { number, color, payout, profit, isWin, totalBet, balance: wallet.balance };
  }
}
