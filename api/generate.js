

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'API 키가 설정되지 않았어요. Vercel 프로젝트의 Environment Variables에 ANTHROPIC_API_KEY를 추가했는지 확인해주세요.'
    });
    return;
  }

  const { system, messages, max_tokens } = req.body || {};

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: max_tokens || 1024,
        system,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      res.status(anthropicRes.status).json({ error: data.error?.message || '원고 생성 중 오류가 발생했어요.' });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: '서버 요청에 실패했어요. 잠시 후 다시 시도해주세요.' });
  }
}
