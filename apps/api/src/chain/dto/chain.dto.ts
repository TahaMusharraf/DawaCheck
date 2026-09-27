import { ApiProperty } from '@nestjs/swagger';

export class ChainStatusResponse {
  @ApiProperty({ example: 80002, description: 'Chain the RPC endpoint is on' })
  chainId!: number;

  @ApiProperty({ example: 12_345_678, description: 'Latest block seen' })
  blockNumber!: number;

  @ApiProperty({
    nullable: true,
    example: '0xD95A8B612971667888beB641e79Ad84D481367DA',
  })
  registryAddress!: string | null;
}

export class BatchResponse {
  @ApiProperty({
    description: 'keccak256 of the batch number, as stored on-chain',
    example: '0xfeb35c4ce964e59f27de5dff696f0587c210fe6c1845f3362b38b424d9577270',
  })
  batchId!: string;

  @ApiProperty({ description: 'Wallet of the licensed manufacturer' })
  manufacturer!: string;

  @ApiProperty({ description: 'Root of the Merkle tree over every unit hash' })
  merkleRoot!: string;

  @ApiProperty({ example: 1000 })
  quantity!: number;

  @ApiProperty({ example: '2026-01-12T00:00:00.000Z' })
  manufacturedAt!: string;

  @ApiProperty({ example: '2027-12-31T00:00:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ example: false })
  recalled!: boolean;

  @ApiProperty({
    description: 'IPFS CID of the off-chain batch metadata',
    example: 'ipfs://demo-metadata',
  })
  metadataCID!: string;
}
