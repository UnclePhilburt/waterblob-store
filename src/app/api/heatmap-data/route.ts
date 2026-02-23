import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pool = getPool();

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO heatmap_data
           (type, page, x, y, scroll_x, scroll_y, absolute_x, absolute_y,
            viewport_width, viewport_height, document_height, element_tag,
            element_id, element_class, element_text, scroll_depth, field_type,
            field_id, field_name, action, section_id, section_class, event_name,
            custom_data, max_scroll_depth, final_scroll_y, time_on_page, url, timestamp)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)`,
          [body.type, body.page, body.x, body.y, body.scrollX, body.scrollY,
           body.absoluteX, body.absoluteY, body.viewportWidth, body.viewportHeight,
           body.documentHeight, body.elementTag, body.elementId, body.elementClass,
           body.elementText, body.scrollDepth, body.fieldType, body.fieldId,
           body.fieldName, body.action, body.sectionId, body.sectionClass,
           body.eventName, body.customData ? JSON.stringify(body.customData) : null,
           body.maxScrollDepth, body.finalScrollY, body.timeOnPage, body.url, body.timestamp]
        );
      } catch (dbError) {
        // silently handled
      }
    }

    return NextResponse.json({ success: true, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save heatmap data' }, { status: 500 });
  }
}
