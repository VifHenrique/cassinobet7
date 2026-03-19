import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany
} from 'typeorm';
import { Bet } from '../../games/entities/bet.entity';
import { Transaction } from '../../wallet/entities/transaction.entity';

export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PLAYER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Bet, (bet) => bet.user)
  bets: Bet[];

  @OneToMany(() => Transaction, (tx) => tx.user)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
