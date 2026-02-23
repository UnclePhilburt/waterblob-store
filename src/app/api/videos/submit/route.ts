import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { applyRateLimit, authLimiter } from '@/lib/rate-limit';
import { isValidEmail } from '@/lib/sanitize';
import validator from 'validator';

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, authLimiter);
  if (limited) return limited;

  try {
    const { video_url, title, description, submitter_name, submitter_email, location } = await request.json();

    if (!video_url || !title || !submitter_name || !submitter_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!isValidEmail(submitter_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (!validator.isURL(video_url, { protocols: ['http', 'https'], require_protocol: true })) {
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 });
    }
    if (title.length < 3 || title.length > 200) {
      return NextResponse.json({ error: 'Title must be between 3 and 200 characters' }, { status: 400 });
    }
    if (description && description.length > 1000) {
      return NextResponse.json({ error: 'Description must be less than 1000 characters' }, { status: 400 });
    }

    let video_type = 'youtube';
    let thumbnail_url: string | null = null;

    if (video_url.includes('youtube.com') || video_url.includes('youtu.be')) {
      video_type = 'youtube';
      const match = video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match) thumbnail_url = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    } else if (video_url.includes('vimeo.com')) {
      video_type = 'vimeo';
    } else if (video_url.includes('tiktok.com')) {
      video_type = 'tiktok';
    } else {
      video_type = 'direct';
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { rows } = await pool.query(
      `INSERT INTO video_wall (video_url, video_type, thumbnail_url, title, description, submitter_name, submitter_email, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [video_url, video_type, thumbnail_url, title, description, submitter_name, submitter_email, location]
    );

    return NextResponse.json({ success: true, message: 'Video submitted successfully! It will appear after approval.', id: rows[0].id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit video' }, { status: 500 });
  }
}
