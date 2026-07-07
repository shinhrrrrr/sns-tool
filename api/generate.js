// 이 파일은 건드릴 필요 없어요.
// "비밀 키를 안전하게 보관하는 중간 창구" 역할만 합니다.
// 실제 키는 이 파일에 적지 않고, Vercel 사이트의 "Environment Variables" 칸에 넣어요.
// (Google Gemini API 사용 — 카드 등록 없이 무료로 쓸 수 있어요)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'API 키가 설정되지 않았어요. Vercel 프로젝트의 Environment Variables에 GEMINI_API_KEY를 추가했는지 확인해주세요.'
    });
    return;
  }

  const { system, messages, max_tokens } = req.body || {};
  const userText = messages?.[0]?.content || '';

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: { maxOutputTokens: max_tokens || 2048 },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      res.status(geminiRes.status).json({ error: data.error?.message || '원고 생성 중 오류가 발생했어요.' });
      return;
    }

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || '')
      .join('\n');
    const finishReason = data.candidates?.[0]?.finishReason;

    // index.html이 기대하는 것과 같은 모양으로 응답을 맞춰줌 (화면 코드는 그대로 두면 됨)
    res.status(200).json({
      content: [{ type: 'text', text }],
      stop_reason: finishReason === 'MAX_TOKENS' ? 'max_tokens' : 'end_turn',
    });
  } catch (err) {
    res.status(500).json({ error: '서버 요청에 실패했어요. 잠시 후 다시 시도해주세요.' });
  }
}
