import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MONTH_NAMES } from '@/types';

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY が設定されていません' },
      { status: 500 }
    );
  }

  try {
    const { title, year, targetMonth } = (await request.json()) as {
      title: string;
      year: string;
      targetMonth?: number;
    };

    if (!title) {
      return NextResponse.json(
        { error: 'title は必須です' },
        { status: 400 }
      );
    }

    const monthContext = targetMonth
      ? `目標月は${MONTH_NAMES[targetMonth - 1]}です。`
      : '目標月は未設定です。';

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      system: `あなたは「ことしやるぞ」というやりたいことリストのアシスタントです。
ユーザーの「やりたいこと」に対して、具体的なネクストアクションを1〜3個提案してください。

ルール:
- 行動的・実践的な提案にすること
- 各アクションは1〜2文で簡潔に
- 日本語で回答すること
- 必ず以下のJSON形式のみで返すこと（前置きや説明文は一切不要）:
{"actions":["アクション1","アクション2","アクション3"]}`,
      messages: [
        {
          role: 'user',
          content: `やりたいこと:「${title}」\n\n${year}年の目標です。${monthContext}\n具体的なネクストアクションを提案してください。`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as { actions: string[] };
    if (!Array.isArray(parsed.actions)) {
      throw new Error('Invalid response format');
    }

    return NextResponse.json({ actions: parsed.actions.slice(0, 3) });
  } catch (error) {
    console.error('AI suggest error:', error);
    return NextResponse.json(
      { error: 'AI提案の取得に失敗しました' },
      { status: 500 }
    );
  }
}
