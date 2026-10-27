import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { AlertStatus } from "src/generated/prisma/enums";

export class ListAlertsDto{
    @IsOptional()
    @IsEnum(AlertStatus)
    @ApiPropertyOptional({ enum: AlertStatus})
    status?: AlertStatus;
}

export class UpdateAlertsDto{
    @IsEnum(AlertStatus)
    @ApiPropertyOptional({ enum: AlertStatus})
    status!: AlertStatus;
}