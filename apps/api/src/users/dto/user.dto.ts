import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto {

    @IsEmail()
    @IsOptional()
    @ApiProperty()
    email?: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    password!: string;

    @IsString()
    @IsOptional()
    @MinLength(8)
    @MaxLength(32)
    @ApiProperty()
    newPassword?: string;
}