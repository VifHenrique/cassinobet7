import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DiceService } from './dice.service';
import { RollDiceDto } from './dto/roll-dice.dto';

@Controller('games/dice')
@UseGuards(JwtAuthGuard)
export class DiceController {
  constructor(private diceService: DiceService) {}

  @Post('roll')
  async roll(@CurrentUser() user: any, @Body() dto: RollDiceDto) {
    return this.diceService.roll(user.id, dto);
  }
}
