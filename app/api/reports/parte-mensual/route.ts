import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { supabaseServer } from '@/lib/supabase-server';
import { formatNumeroPartee } from '@/lib/utils';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const periodo = `${MESES[mes - 1] ?? mes} ${ano}`;
  doc.fontSize(18).text(`Informe de partes de trabajo — ${periodo}`, { align: 'center' });
  doc.moveDown(1.5);

  const columns = [
    { label: 'Nº Parte', width: 70 },
    { label: 'Trabajador', width: 140 },
    { label: 'Fecha', width: 80 },
    { label: 'Horas', width: 60 },
    { label: 'Cliente', width: 140 }
  ];

  const drawRow = (values: string[], y: number, isHeader = false) => {
    let x = doc.page.margins.left;
    doc.fontSize(isHeader ? 10 : 9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
    columns.forEach((col, i) => {
      doc.text(values[i], x, y, { width: col.width, ellipsis: true });
      x += col.width;
    });
  };

  let y = doc.y;
  drawRow(columns.map((c) => c.label), y, true);
  y += 18;
  doc.moveTo(doc.page.margins.left, y - 4).lineTo(doc.page.width - doc.page.margins.right, y - 4).stroke();

  if (registros.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No hay registros para este periodo.', doc.page.margins.left, y);
  }

  for (const registro of registros) {
    if (y > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;
      drawRow(columns.map((c) => c.label), y, true);
      y += 18;
      doc.moveTo(doc.page.margins.left, y - 4).lineTo(doc.page.width - doc.page.margins.right, y - 4).stroke();
    }

    drawRow(
      [
        formatNumeroPartee(registro.partes?.numero_parte ?? 0),
        registro.partes?.users?.nombre ?? 'N/A',
        new Date(registro.fecha).toLocaleDateString('es-ES'),
        String(registro.horas),
        registro.partes?.clientes?.nombre ?? 'N/A'
      ],
      y
    );
    y += 16;
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
