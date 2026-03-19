import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Bet } from './entities/bet.entity';
import { SlotService } from './slot/slot.service';
import { SlotController } from './slot/slot.controller';
import { DiceService } from './dice/dice.service';
import { DiceController } from './dice/dice.controller';
import { RouletteService } from './roulette/roulette.service';
import { RouletteGateway } from './roulette/roulette.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bet]),
    WalletModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SlotService, DiceService, RouletteService, RouletteGateway],
  controllers: [SlotController, DiceController],
  exports: [SlotService, DiceService, RouletteService],
})
export class GamesModule {}
