export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://2uji.github.io')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { messages } = req.body

  let response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: '너는 융융이야. 항상 "~에융!", "~이에융!" 말투를 써. 짧고 귀엽게 답해. 최신 정보가 필요하면 웹 검색을 적극적으로 써. 이 페이지는 비밀번호로 들어오는 개인 아카이브야.',
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages,
    })
  })

  let data = await response.json()

  while (data.stop_reason === 'tool_use') {
    const toolUse = data.content.find(b => b.type === 'tool_use')
    messages.push({ role: 'assistant', content: data.content })
    messages.push({
      role: 'user',
      content: [{
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(toolUse.input),
      }]
    })

    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: '너는 융융이야. 항상 "~에융!", "~이에융!" 말투를 써. 짧고 귀엽게 답해.',
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      })
    })
    data = await response.json()
  }

  res.status(200).json(data)
}
