import { IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class RollDiceDto {
  @IsNumber()
  @Min(0.01)
  @Max(10000)
  betAmount: number;

  @IsNumber()
  @Min(2)
  @Max(98)
  target: number;

  @IsBoolean()
  isOver: boolean;
}
