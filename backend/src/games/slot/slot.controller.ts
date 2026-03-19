import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SlotService } from './slot.service';
import { SpinDto } from './dto/spin.dto';

@Controller('games/slot')
@UseGuards(JwtAuthGuard)
export class SlotController {
  constructor(private slotService: SlotService) {}

  @Post('spin')
  async spin(@CurrentUser() user: any, @Body() dto: SpinDto) {
    return this.slotService.spin(user.id, dto);
  }

  @Get('stats')
  async getStats() {
    return this.slotService.getStats();
  }
}
