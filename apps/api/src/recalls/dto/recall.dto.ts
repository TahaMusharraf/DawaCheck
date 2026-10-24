import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class RecallDto {
    
    @IsString()
    @Matches(/^0x[0-9a-fA-F]{64}$/) 
    @ApiProperty()
    batchId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    @ApiProperty()
    reason!: string;
}