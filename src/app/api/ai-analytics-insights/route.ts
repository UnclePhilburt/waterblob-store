import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
    }

    const { analytics, debugLogs, currentStats } = await request.json();
    if (!analytics && !debugLogs && !currentStats) {
      return NextResponse.json({ error: 'At least one of analytics, debugLogs, or currentStats is required' }, { status: 400 });
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an analytics expert for Water Blob\u00ae, a company that manufactures and sells water blobs. Analyze the provided data and return insights in the following JSON format:
{
  "keyFindings": ["finding 1", "finding 2", ...],
  "patterns": ["pattern 1", "pattern 2", ...],
  "predictions": ["prediction 1", "prediction 2", ...],
  "technicalIssues": ["issue 1", "issue 2", ...]
}
Be specific, actionable, and data-driven in your analysis. If debug logs are provided, identify any technical issues or errors.`,
        },
        {
          role: 'user',
          content: `Please analyze the following data:\n\nAnalytics Data:\n${JSON.stringify(analytics || {}, null, 2)}\n\nDebug Logs:\n${JSON.stringify(debugLogs || [], null, 2)}\n\nCurrent Stats:\n${JSON.stringify(currentStats || {}, null, 2)}`,
        },
      ],
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content || '';

    // Try to parse JSON response
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          keyFindings: parsed.keyFindings || [],
          patterns: parsed.patterns || [],
          predictions: parsed.predictions || [],
          technicalIssues: parsed.technicalIssues || [],
        });
      }
    } catch {
      // If JSON parsing fails, return the raw text split into findings
    }

    return NextResponse.json({
      keyFindings: [reply],
      patterns: [],
      predictions: [],
      technicalIssues: [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to analyze analytics data' }, { status: 500 });
  }
}
