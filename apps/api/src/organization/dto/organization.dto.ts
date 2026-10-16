import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { OrgStatus, OrgType } from "src/generated/prisma/enums";

export class ListOrgsQueryDto {
    @IsString()
    @IsOptional()
    @ApiPropertyOptional()
    orgName?: string;

    @IsOptional()
    @ApiPropertyOptional({enum: OrgType})
    @IsEnum(OrgType)
    orgType?: OrgType;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional()
    city?: string;

    @IsOptional()
    @ApiPropertyOptional({ enum: OrgStatus })
    @IsEnum(OrgStatus)
    status?: OrgStatus;
}