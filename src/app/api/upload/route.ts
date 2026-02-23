import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await saveUploadedFile(file, 'file');

    return NextResponse.json({
      fileUrl: `/uploads/${result.filename}`,
      filename: result.filename,
      originalName: result.originalName,
      size: result.size,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
