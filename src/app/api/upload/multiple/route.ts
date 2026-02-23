import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 files allowed per upload' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const result = await saveUploadedFile(file, 'file');
      results.push({
        fileUrl: `/uploads/${result.filename}`,
        filename: result.filename,
        originalName: result.originalName,
        size: result.size,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to upload files' },
      { status: 500 }
    );
  }
}
