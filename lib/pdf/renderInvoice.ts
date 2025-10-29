import { PDFDocument, StandardFonts } from 'pdf-lib';

interface InvoicePdfOptions {
  invoiceNumber: string;
  amount: number;
  issuedAt: string;
  dueAt?: string | null;
  customerName?: string | null;
  lineItems?: Array<{ description: string; quantity: number; unitPrice: number }>;
}

export async function renderInvoicePdf({
  invoiceNumber,
  amount,
  issuedAt,
  dueAt,
  customerName,
  lineItems = [],
}: InvoicePdfOptions) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const draw = (text: string, x: number, y: number) => {
    page.drawText(text, { x, y, size: 12, font });
  };

  draw('inCommand Invoice', 50, 740);
  draw(`Invoice #: ${invoiceNumber}`, 50, 710);
  draw(`Issued: ${issuedAt}`, 50, 690);
  if (dueAt) {
    draw(`Due: ${dueAt}`, 50, 670);
  }
  if (customerName) {
    draw(`Customer: ${customerName}`, 50, 650);
  }

  let currentY = 620;
  lineItems.forEach((item, index) => {
    draw(`${index + 1}. ${item.description}`, 60, currentY);
    draw(`Qty: ${item.quantity}`, 400, currentY);
    draw(`Unit: £${item.unitPrice.toFixed(2)}`, 460, currentY);
    currentY -= 20;
  });

  draw(`Total: £${amount.toFixed(2)}`, 50, currentY - 20);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
