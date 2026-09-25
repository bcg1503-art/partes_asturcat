import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { supabaseServer } from '@/lib/supabase-server';
import { formatNumeroPartee } from '@/lib/utils';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const BRAND = '#C9631A';
const BRAND_TINT = '#FBF0E6';
const TEXT_DARK = '#27231F';
const TEXT_MUTED = '#7A7269';
const BORDER = '#E9E1D8';

const LOGO_PATH = path.join(process.cwd(), 'public/branding/asturcat-logo.png');

const COLUMNS = [
  { key: 'numero', label: 'Nº Parte', width: 65, align: 'left' as const },
  { key: 'trabajador', label: 'Trabajador', width: 150, align: 'left' as const },
  { key: 'fecha', label: 'Fecha', width: 80, align: 'left' as const },
  { key: 'horas', label: 'Horas', width: 55, align: 'right' as const },
  { key: 'cliente', label: 'Cliente', width: 165, align: 'left' as const }
];

interface RegistroConParte {
  fecha: string;
  horas: number;
  partes: {
    numero_parte: number;
    users: { nombre: string } | null;
    clientes: { nombre: string } | null;
  } | null;
}

export async function GET(request: Request) {
  const supabase = await supabaseServer();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('users').select('rol').eq('id', sessionData.session.user.id).single();
  if (profile?.rol !== 'administrador') {
    return NextResponse.json({ error: 'No tienes permisos.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const mes = Number(searchParams.get('mes'));
  const ano = Number(searchParams.get('ano'));
  if (!mes || !ano || mes < 1 || mes > 12) {
    return NextResponse.json({ error: 'Parámetros mes/ano inválidos.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('registros_parte')
    .select('fecha, horas, partes!inner(numero_parte, mes, ano, users(nombre), clientes(nombre))')
    .eq('partes.mes', mes)
    .eq('partes.ano', ano);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const registros = ((data ?? []) as unknown as RegistroConParte[]).slice().sort((a, b) => {
    const numA = a.partes?.numero_parte ?? 0;
    const numB = b.partes?.numero_parte ?? 0;
    if (numA !== numB) return numA - numB;
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  });

  const totalHoras = registros.reduce((sum, registro) => sum + Number(registro.horas), 0);
  const periodo = `${MESES[mes - 1] ?? mes} ${ano}`;
  const generadoEl = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const logoExists = fs.existsSync(LOGO_PATH);

  const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const rowHeight = 22;

  function drawLetterhead() {
    const top = doc.page.margins.top;
    const logoSize = 44;

    if (logoExists) {
      doc.image(LOGO_PATH, marginLeft, top, { width: logoSize, height: logoSize });
    }
    const textX = marginLeft + (logoExists ? logoSize + 14 : 0);
    doc
      .fillColor(BRAND)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('ASTURCAT CONSTRUCCIONES', textX, top + 2, { lineBreak: false });
    doc
      .fillColor(TEXT_MUTED)
      .font('Helvetica')
      .fontSize(8.5)
      .text('asturcatconstrucciones.com', textX, top + 21, { lineBreak: false })
      .text('Reformas, albañilería, pintura y paneles sándwich · Barcelona', textX, top + 33, { lineBreak: false });

    doc
      .fillColor(TEXT_MUTED)
      .font('Helvetica')
      .fontSize(8)
      .text(`Generado el ${generadoEl}`, marginLeft, top + 2, { width: contentWidth, align: 'right' });

    const dividerY = top + logoSize + 14;
    doc.moveTo(marginLeft, dividerY).lineTo(pageWidth - marginRight, dividerY).lineWidth(1.5).strokeColor(BRAND).stroke();

    let y = dividerY + 20;
    doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(15).text('Informe de partes de trabajo', marginLeft, y);
    y += 20;
    doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(11).text(periodo, marginLeft, y);
    y += 26;
    return y;
  }

  function drawTableHeader(y: number) {
    doc.rect(marginLeft, y, contentWidth, rowHeight).fill(BRAND);
    let x = marginLeft;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
    for (const col of COLUMNS) {
      doc.text(col.label, x + 8, y + 7, { width: col.width - 12, align: col.align, lineBreak: false });
      x += col.width;
    }
    return y + rowHeight;
  }

  function drawRow(values: string[], y: number, shaded: boolean) {
    if (shaded) {
      doc.rect(marginLeft, y, contentWidth, rowHeight).fill(BRAND_TINT);
    }
    let x = marginLeft;
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_DARK);
    COLUMNS.forEach((col, i) => {
      doc.text(values[i], x + 8, y + 6, { width: col.width - 12, align: col.align, ellipsis: true, lineBreak: false });
      x += col.width;
    });
    doc
      .moveTo(marginLeft, y + rowHeight)
      .lineTo(marginLeft + contentWidth, y + rowHeight)
      .lineWidth(0.5)
      .strokeColor(BORDER)
      .stroke();
  }

  function ensureSpace(y: number, needed: number) {
    if (y + needed > pageHeight - doc.page.margins.bottom - 40) {
      doc.addPage();
      const restartY = doc.page.margins.top;
      doc
        .fillColor(TEXT_MUTED)
        .font('Helvetica')
        .fontSize(8)
        .text(`Asturcat Construcciones · Informe de partes de trabajo · ${periodo}`, marginLeft, restartY);
      return drawTableHeader(restartY + 16);
    }
    return y;
  }

  let y = drawLetterhead();
  y = drawTableHeader(y);

  if (registros.length === 0) {
    doc
      .fillColor(TEXT_MUTED)
      .font('Helvetica')
      .fontSize(10)
      .text('No hay registros para este periodo.', marginLeft, y + 10);
  } else {
    registros.forEach((registro, index) => {
      y = ensureSpace(y, rowHeight);
      drawRow(
        [
          formatNumeroPartee(registro.partes?.numero_parte ?? 0),
          registro.partes?.users?.nombre ?? 'N/A',
          new Date(registro.fecha).toLocaleDateString('es-ES'),
          String(registro.horas),
          registro.partes?.clientes?.nombre ?? 'N/A'
        ],
        y,
        index % 2 === 1
      );
      y += rowHeight;
    });

    y = ensureSpace(y, rowHeight + 10);
    y += 10;
    doc.moveTo(marginLeft, y).lineTo(marginLeft + contentWidth, y).lineWidth(1).strokeColor(BRAND).stroke();
    y += 10;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(TEXT_DARK)
      .text(`Total de horas: ${totalHoras}`, marginLeft, y, { width: contentWidth, align: 'right' });
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const footerY = pageHeight - doc.page.margins.bottom + 10;
    // Writing inside the reserved bottom margin would otherwise make pdfkit
    // think the content overflowed and silently insert an extra blank page.
    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .fillColor(TEXT_MUTED)
      .font('Helvetica')
      .fontSize(8)
      .text('Asturcat Construcciones · asturcatconstrucciones.com', marginLeft, footerY, { lineBreak: false })
      .text(`Página ${i + 1} de ${range.count}`, marginLeft, footerY, { width: contentWidth, align: 'right', lineBreak: false });
    doc.page.margins.bottom = originalBottomMargin;
  }

  doc.end();
  const buffer = await done;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="partes-${mes}-${ano}.pdf"`
    }
  });
}
