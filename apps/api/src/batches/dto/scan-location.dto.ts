import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from "class-validator";

export class ScanLocationDto {
    
    @IsOptional()
    @Type(() => Number)
    @IsLatitude()
    @ApiPropertyOptional()
    lat?: number;

    @IsOptional()
    @Type(() => Number)
    @IsLongitude()
    @ApiPropertyOptional()
    lng?: number;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    @ApiPropertyOptional()
    city?: string;
}