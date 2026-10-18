import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsInt, IsString, Matches, Max, Min } from "class-validator";

export class TransferCustodyDto {
    
    @IsString()
    @Matches(/^0x[0-9a-fA-F]{64}$/)
    @ApiProperty()
    batchId!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    toOrgId!: string;

    @IsInt()
    @Min(1)
    @Max(5000)
    @ApiProperty()
    quantity!: number;
}