import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface LabelsBatch {
    batchId: string;
    batchNumber: string;
    drugName: string;
    dosage: string;
    expiryDate: Date;
}

// A4 in points, 4 x 6 labels per page.
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 30;
const COLS = 4;
const ROWS = 6;
const CELL_W = (PAGE_W - 2 * MARGIN) / COLS;
const CELL_H = (PAGE_H - 2 * MARGIN) / ROWS;
const QR_SIZE = 88;

export async function buildLabelsPdf(
    batch: LabelsBatch,
    codes: string[],
    verifyBaseUrl: string
): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN })

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) =>
        doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    const expiry = batch.expiryDate.toISOString().slice(0, 7); // 2028-01
    const perPage = COLS * ROWS;

    for (let i = 0; i < codes.length; i++) {
        if (i > 0 && i % perPage === 0) doc.addPage();

        const slot = i % perPage;
        const x = MARGIN + (slot % COLS) * CELL_W;
        const y = MARGIN + Math.floor(slot / COLS) * CELL_H;
        const png = await QRCode.toBuffer(`${verifyBaseUrl}/${batch.batchId}.${codes[i]}`, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 300,
        });
        doc.image(png, x + (CELL_W - QR_SIZE) / 2, y + 4, { width: QR_SIZE });
        const textY = y + QR_SIZE + 8;
        const opts = { width: CELL_W, align: 'center' as const };
    
        doc.fontSize(7).text(`${batch.drugName} ${batch.dosage}`, x, textY, opts);
        doc.text(`Batch ${batch.batchNumber} | Exp ${expiry}`, x, textY + 9, opts);
        doc.font('Courier').text(codes[i], x, textY + 18, opts).font('Helvetica');
    }
    doc.end();
    return done;
  }
