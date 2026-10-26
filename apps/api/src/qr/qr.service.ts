import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env';
import { buildLabelsPdf, LabelsBatch } from './labels-pdf';

@Injectable()
export class QrService {

    constructor(
        private config: ConfigService<Env, true>
    ) {}

    labelsPdf(batch: LabelsBatch, codes: string[]) {
        return buildLabelsPdf(batch, codes, this.config.get('VERIFY_BASE_URL', { infer: true}))
    }
}
