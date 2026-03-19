import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private config: ConfigService,
  ) {}

  async create(data: { email: string; username: string; password: string }): Promise<User> {
    const initialBalance = parseFloat(this.config.get('INITIAL_BALANCE', '1000'));
    const user = this.userRepo.create({ ...data, balance: initialBalance });
    return this.userRepo.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({ select: ['id', 'email', 'username', 'balance', 'role', 'isActive', 'createdAt'] });
  }

  async updateBalance(userId: string, newBalance: number): Promise<void> {
    await this.userRepo.update(userId, { balance: newBalance });
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username', 'balance', 'role', 'createdAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleActive(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.isActive = !user.isActive;
    return this.userRepo.save(user);
  }
}
