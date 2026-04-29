import { NextRequest } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { SalesExportRow } from '@/components/sales/types';

type ExportRequestBody = {
  format?: 'excel' | 'pdf';
  periodLabel?: string;
  rows?: SalesExportRow[];
};

function escapeCsv(value: string) {
  const normalized = value.replaceAll('"', '""');
  return `"${normalized}"`;
}

function buildCsv(rows: SalesExportRow[]) {
  const headers = ['Fecha', 'Hora', 'Ticket', 'Cliente', 'Cajero', 'Metodo de pago', 'Referencia', 'Total USD'];
  const lines = rows.map((row) =>
    [
      row.fecha,
      row.hora,
      row.ticket,
      row.cliente,
      row.cajero,
      row.metodoPago,
      row.referencia,
      row.total,
    ]
      .map((value) => escapeCsv(value))
      .join(',')
  );

  return [headers.join(','), ...lines].join('\n');
}

async function buildPdf(rows: SalesExportRow[], periodLabel: string) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const marginX = 36;
  let y = 555;

  const drawPageHeader = () => {
    page.drawText('Reporte de ventas', {
      x: marginX,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.09, 0.19, 0.17),
    });
    page.drawText(`Periodo: ${periodLabel}`, {
      x: marginX,
      y: y - 22,
      size: 11,
      font,
      color: rgb(0.34, 0.39, 0.37),
    });
    page.drawText('Fecha | Hora | Ticket | Cliente | Metodo | Total', {
      x: marginX,
      y: y - 48,
      size: 10,
      font: boldFont,
      color: rgb(0.09, 0.19, 0.17),
    });
    y -= 70;
  };

  drawPageHeader();

  for (const row of rows) {
    if (y < 40) {
      page = pdf.addPage([842, 595]);
      y = 555;
      drawPageHeader();
    }

    const line = `${row.fecha} | ${row.hora} | ${row.ticket} | ${row.cliente} | ${row.metodoPago} | $${row.total}`;
    page.drawText(line.slice(0, 110), {
      x: marginX,
      y,
      size: 9,
      font,
      color: rgb(0.15, 0.19, 0.18),
    });
    y -= 16;
  }

  return pdf.save();
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ExportRequestBody;
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const periodLabel = body.periodLabel || 'Reporte';

  if (rows.length === 0) {
    return new Response('No hay datos para exportar.', { status: 400 });
  }

  if (body.format === 'pdf') {
    const pdfBytes = await buildPdf(rows, periodLabel);
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ventas.pdf"',
      },
    });
  }

  const csv = buildCsv(rows);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ventas.csv"',
    },
  });
}