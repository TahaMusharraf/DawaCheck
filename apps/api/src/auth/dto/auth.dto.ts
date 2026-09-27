import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { OrgType } from 'src/generated/prisma/browser';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    orgName!: string;

    @IsIn(['MANUFACTURER','DISTRIBUTOR','PHARMACY'])
    @IsNotEmpty()
    @ApiProperty()
    @ApiProperty({ enum: ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY'] })
    orgType!: OrgType;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    licenseNo!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    city!: string;

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(32)
    @ApiProperty()
    password!: string;
}

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    email!: string;

    @IsString()
    @IsNotEmpty()   
    @ApiProperty()
    password!: string;
}