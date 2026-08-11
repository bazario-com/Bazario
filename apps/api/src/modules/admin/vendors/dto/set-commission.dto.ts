import { IsInt, Max, Min } from 'class-validator';

export class SetCommissionDto {
  @IsInt()
  @Min(0)
  @Max(10000)
  commissionRateBps: number;
}
