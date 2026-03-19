import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum GameType {
  SLOT = 'SLOT',
  ROULETTE = 'ROULETTE',
  DICE = 'DICE',
}

export enum BetStatus {
  WIN = 'WIN',
  LOSS = 'LOSS',
  PENDING = 'PENDING',
}

@Entity('bets')
export class Bet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.bets)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: GameType })
  game: GameType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  payout: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0 })
  multiplier: number;

  @Column({ type: 'enum', enum: BetStatus, default: BetStatus.PENDING })
  status: BetStatus;

  @Column({ type: 'jsonb', nullable: true })
  gameData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
