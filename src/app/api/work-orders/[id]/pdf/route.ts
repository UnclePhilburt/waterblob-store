import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pool = getPool();
    if (!pool) {
      return new Response('Database not configured', { status: 500 });
    }

    const { id } = await params;

    const result = await pool.query(
      'SELECT pdf_data FROM work_orders WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].pdf_data) {
      return new Response('PDF not found', { status: 404 });
    }

    const pdfBuffer = Buffer.from(result.rows[0].pdf_data, 'base64');

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=work-order-${id}.pdf`,
      },
    });
  } catch (error) {
    return new Response('Failed to fetch PDF', { status: 500 });
  }
}
