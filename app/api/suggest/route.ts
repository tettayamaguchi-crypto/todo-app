import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Period } from '@/types';

// 期間ごとの提案指示（緊急度・抽象度を変える）
const PERIOD_GUIDANCE: Record<Period, string> = {
  week: '期限は1週間以内です。今日または今週中に実行できる、具体的で緊急度の高いアクションを提案してください。',
  month: '期限は1ヶ月です。今週から着手できる具体的な最初のステップを提案してください。',
  '3months': '期限は3ヶ月です。まず調べる・準備するための段階的なアクションを提案してください。',
  '6months': '期限は半年です。方向性を決める・情報収集する大まかなアクションを提案してください。',
  year: '期限は1年です。長期計画を立てる・必要なリソースや知識を調べるアクションを提案してください。',
  none: '期限は特に決まっていません。まず一歩踏み出すための取り掛かりやすいアクションを提案してください。',
  custom: '期限日が設定されています。その期日までに完了できる具体的なアクションを提案してください。',
};

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY が設定されていません' },
      { status: 500 }
    );
  }

  try {
    const { text, period } = (await request.json()) as {
      text: string;
      period: Period;
    };

    if (!text || !period) {
      return NextResponse.json(
        { error: 'text と period は必須です' },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // モデル: claude-opus-4-6（コスト重視なら claude-haiku-4-5 に変更可）
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      system: `あなたはやりたいことリストのアシスタントです。
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
          content: `やりたいこと:「${text}」\n\n${PERIOD_GUIDANCE[period]}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // レスポンスからJSONを抽出
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
