import { IsNumber, Min, Max } from 'class-validator';

export class SpinDto {
  @IsNumber()
  @Min(0.01)
  @Max(10000)
  betAmount: number;
}
