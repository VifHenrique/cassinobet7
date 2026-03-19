import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { Bet, GameType, BetStatus } from '../entities/bet.entity';
import { WalletService } from '../../wallet/wallet.service';
import { TransactionType } from '../../wallet/entities/transaction.entity';
import { SpinDto } from './dto/spin.dto';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣', '🃏'];

const PAYTABLE: Record<string, number> = {
  '🍒🍒🍒': 3,
  '🍋🍋🍋': 4,
  '🍊🍊🍊': 5,
  '🍇🍇🍇': 8,
  '⭐⭐⭐': 15,
  '💎💎💎': 25,
  '7️⃣7️⃣7️⃣': 50,
  '🃏🃏🃏': 100,
  '🍒🍒': 1.5,
  '7️⃣7️⃣': 5,
  '💎💎': 3,
};

const RTP = 0.96; // 96% Return to Player

@Injectable()
export class SlotService {
  constructor(
    @InjectRepository(Bet)
    private betRepo: Repository<Bet>,
    private walletService: WalletService,
  ) {}

  private spinReel(reels = 3): string[] {
    const result: string[] = [];
    for (let i = 0; i < reels; i++) {
      // Weight symbols — rarer = less weight
      const weights = [20, 18, 16, 14, 12, 8, 6, 6]; // total = 100
      const roll = randomInt(0, 100);
      let cumulative = 0;
      let symbolIndex = 0;
      for (let w = 0; w < weights.length; w++) {
        cumulative += weights[w];
        if (roll < cumulative) { symbolIndex = w; break; }
      }
      result.push(SYMBOLS[symbolIndex]);
    }
    return result;
  }

  private calculatePayout(reels: string[], betAmount: number): { multiplier: number; isWin: boolean } {
    const key = reels.join('');
    // Check exact match
    if (PAYTABLE[key]) {
      return { multiplier: PAYTABLE[key], isWin: true };
    }
    // Check first two matching
    if (reels[0] === reels[1]) {
      const twoKey = `${reels[0]}${reels[1]}`;
      if (PAYTABLE[twoKey]) {
        return { multiplier: PAYTABLE[twoKey], isWin: true };
      }
    }
    return { multiplier: 0, isWin: false };
  }

  async spin(userId: string, dto: SpinDto) {
    const { betAmount } = dto;
    if (betAmount <= 0 || betAmount > 10000) {
      throw new BadRequestException('Bet must be between 0.01 and 10000');
    }

    // Debit bet
    await this.walletService.debit(userId, betAmount, `Slot spin bet`, undefined);

    // Spin reels
    const reels = this.spinReel(3);
    const { multiplier, isWin } = this.calculatePayout(reels, betAmount);

    const payout = isWin ? parseFloat((betAmount * multiplier).toFixed(2)) : 0;
    const profit = parseFloat((payout - betAmount).toFixed(2));

    // Credit winnings
    if (isWin && payout > 0) {
      await this.walletService.credit(
        userId, payout,
        TransactionType.WIN,
        `Slot win x${multiplier}`,
      );
    }

    // Record bet
    const bet = this.betRepo.create({
      userId,
      game: GameType.SLOT,
      amount: betAmount,
      payout,
      multiplier,
      status: isWin ? BetStatus.WIN : BetStatus.LOSS,
      gameData: { reels, symbols: SYMBOLS },
      result: { reels, multiplier, payout, profit },
    });
    await this.betRepo.save(bet);

    const wallet = await this.walletService.getBalance(userId);

    return {
      betId: bet.id,
      reels,
      isWin,
      multiplier,
      betAmount,
      payout,
      profit,
      balance: wallet.balance,
    };
  }

  async getStats() {
    return {
      symbols: SYMBOLS,
      paytable: PAYTABLE,
      rtp: RTP,
      maxMultiplier: 100,
    };
  }
}
