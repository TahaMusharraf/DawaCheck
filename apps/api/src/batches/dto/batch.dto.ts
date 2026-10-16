import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsInt, IsNotEmpty,IsString, Max, Min } from "class-validator";

export class CreateBatchDto {
    
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    drugName!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    batchNumber!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    dosage!: string;

    @IsInt()
    @IsNotEmpty()
    @Min(1)
    @Max(5000)
    @ApiProperty()
    quantity!: number;

    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    @ApiProperty()
    manufacturingDate!: Date;

    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    @ApiProperty()
    expiryDate!: Date;
}