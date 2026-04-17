import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      project,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
    } = body as {
      name?: string;
      phone?: string;
      project?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
      utm_term?: string;
      fbclid?: string;
    };

    /* ── Validation ── */
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Имя обязательно (минимум 2 символа)' },
        { status: 400 },
      );
    }
    if (!phone || phone.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Телефон обязателен (минимум 5 символов)' },
        { status: 400 },
      );
    }

    /* ── Env vars ── */
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('[lead] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration' },
        { status: 500 },
      );
    }

    /* ── Current date in Asia/Almaty ── */
    const now = new Date();
    const dateStr = now.toLocaleString('ru-RU', {
      timeZone: 'Asia/Almaty',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    /* ── Build UTM block ── */
    const utmLines: string[] = [];
    if (utm_source) utmLines.push(`  • utm_source: <code>${utm_source}</code>`);
    if (utm_medium) utmLines.push(`  • utm_medium: <code>${utm_medium}</code>`);
    if (utm_campaign) utmLines.push(`  • utm_campaign: <code>${utm_campaign}</code>`);
    if (utm_content) utmLines.push(`  • utm_content: <code>${utm_content}</code>`);
    if (utm_term) utmLines.push(`  • utm_term: <code>${utm_term}</code>`);

    /* ── Compose message ── */
    const lines: string[] = [
      '🔥 <b>Новая заявка!</b>',
      '',
      `👤 <b>Имя:</b> ${escapeHtml(name.trim())}`,
      `📞 <b>Телефон:</b> ${escapeHtml(phone.trim())}`,
    ];

    if (project && project.trim()) {
      lines.push(`🏥 <b>Проект:</b> ${escapeHtml(project.trim())}`);
    }

    if (utmLines.length > 0) {
      lines.push('');
      lines.push('📊 <b>UTM:</b>');
      lines.push(...utmLines);
    }

    if (fbclid) {
      lines.push(`🔗 <b>fbclid:</b> <code>${escapeHtml(fbclid)}</code>`);
    }

    lines.push('');
    lines.push(`📅 ${dateStr}`);

    const text = lines.join('\n');

    /* ── Send via Telegram Bot API ── */
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!tgRes.ok) {
      const errBody = await tgRes.text();
      console.error('[lead] Telegram API error:', tgRes.status, errBody);
      return NextResponse.json(
        { success: false, error: 'Failed to send Telegram message' },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[lead] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/* ── Helpers ── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
