import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { Bet, GameType, BetStatus } from '../entities/bet.entity';
import { WalletService } from '../../wallet/wallet.service';
import { TransactionType } from '../../wallet/entities/transaction.entity';
import { RollDiceDto } from './dto/roll-dice.dto';

@Injectable()
export class DiceService {
  constructor(
    @InjectRepository(Bet)
    private betRepo: Repository<Bet>,
    private walletService: WalletService,
  ) {}

  private calculateMultiplier(target: number, isOver: boolean): number {
    // If rolling over target: win chance = (99 - target) / 100
    // If rolling under target: win chance = (target - 1) / 100
    const houseEdge = 0.01;
    const winChance = isOver ? (99 - target) / 100 : (target - 1) / 100;
    if (winChance <= 0) return 0;
    return parseFloat(((1 / winChance) * (1 - houseEdge)).toFixed(4));
  }

  async roll(userId: string, dto: RollDiceDto) {
    const { betAmount, target, isOver } = dto;

    if (betAmount <= 0 || betAmount > 10000) {
      throw new BadRequestException('Bet must be between 0.01 and 10000');
    }
    if (target < 2 || target > 98) {
      throw new BadRequestException('Target must be between 2 and 98');
    }

    const multiplier = this.calculateMultiplier(target, isOver);
    if (multiplier < 1.01) {
      throw new BadRequestException('Multiplier too low — adjust your target');
    }

    // Debit
    await this.walletService.debit(userId, betAmount, `Dice roll bet`, undefined);

    // Roll the dice (1–100)
    const roll = randomInt(1, 101);
    const isWin = isOver ? roll > target : roll < target;
    const payout = isWin ? parseFloat((betAmount * multiplier).toFixed(2)) : 0;
    const profit = parseFloat((payout - betAmount).toFixed(2));

    if (isWin) {
      await this.walletService.credit(
        userId, payout,
        TransactionType.WIN,
        `Dice win x${multiplier}`,
      );
    }

    const bet = this.betRepo.create({
      userId,
      game: GameType.DICE,
      amount: betAmount,
      payout,
      multiplier,
      status: isWin ? BetStatus.WIN : BetStatus.LOSS,
      gameData: { target, isOver },
      result: { roll, isWin, multiplier, payout, profit },
    });
    await this.betRepo.save(bet);

    const wallet = await this.walletService.getBalance(userId);

    return {
      betId: bet.id,
      roll,
      target,
      isOver,
      isWin,
      multiplier,
      betAmount,
      payout,
      profit,
      balance: wallet.balance,
    };
  }
}
