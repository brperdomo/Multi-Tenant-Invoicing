import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface InvoiceData {
  invoice_number: string;
  facility_name: string;
  facility_address?: string;
  amount: number;
  due_date: string;
  billing_period: string;
  period_start: string;
  period_end: string;
  notes?: string;
  created_at: string;
}

export const generateInvoicePDF = async (
  invoiceData: InvoiceData,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      // Header - Company Name
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Aviata Health Group', 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Healthcare Services', 50, 80)
        .moveDown();

      // Invoice Title
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 50, { align: 'right' });

      // Invoice Details Box
      const detailsY = 120;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Invoice Number:', 50, detailsY)
        .font('Helvetica')
        .text(invoiceData.invoice_number, 150, detailsY);

      doc
        .font('Helvetica-Bold')
        .text('Invoice Date:', 50, detailsY + 20)
        .font('Helvetica')
        .text(
          new Date(invoiceData.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          150,
          detailsY + 20
        );

      doc
        .font('Helvetica-Bold')
        .text('Due Date:', 50, detailsY + 40)
        .font('Helvetica')
        .text(
          new Date(invoiceData.due_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          150,
          detailsY + 40
        );

      // Bill To Section
      const billToY = detailsY + 80;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('BILL TO:', 50, billToY);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(invoiceData.facility_name, 50, billToY + 20);

      if (invoiceData.facility_address) {
        doc.text(invoiceData.facility_address, 50, billToY + 35, {
          width: 200,
        });
      }

      // Line separator
      const tableTop = billToY + 100;
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableTop)
        .lineTo(550, tableTop)
        .stroke();

      // Table Header
      const tableHeaderY = tableTop + 15;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, tableHeaderY)
        .text('Billing Period', 280, tableHeaderY)
        .text('Amount', 450, tableHeaderY, { align: 'right' });

      // Table line
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableHeaderY + 20)
        .lineTo(550, tableHeaderY + 20)
        .stroke();

      // Table Content
      const itemY = tableHeaderY + 35;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          `Healthcare Services - ${invoiceData.billing_period.replace('_', ' ').toUpperCase()}`,
          50,
          itemY,
          { width: 220 }
        )
        .text(
          `${new Date(invoiceData.period_start).toLocaleDateString()} - ${new Date(
            invoiceData.period_end
          ).toLocaleDateString()}`,
          280,
          itemY
        )
        .text(
          `$${Number(invoiceData.amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          450,
          itemY,
          { align: 'right' }
        );

      // Subtotal line
      const subtotalY = itemY + 40;
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(350, subtotalY)
        .lineTo(550, subtotalY)
        .stroke();

      // Total
      const totalY = subtotalY + 15;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL DUE:', 350, totalY)
        .text(
          `$${Number(invoiceData.amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          450,
          totalY,
          { align: 'right' }
        );

      // Notes section
      if (invoiceData.notes) {
        const notesY = totalY + 60;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Notes:', 50, notesY);

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(invoiceData.notes, 50, notesY + 20, {
            width: 500,
            align: 'left',
          });
      }

      // Footer
      const footerY = 700;
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          'Please make payment by the due date. For questions, contact billing@aviatahealth.com',
          50,
          footerY,
          {
            align: 'center',
            width: 500,
          }
        );

      doc
        .fontSize(8)
        .text('Thank you for your business!', 50, footerY + 30, {
          align: 'center',
          width: 500,
        });

      // Finalize PDF
      doc.end();

      writeStream.on('finish', () => {
        resolve();
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};
