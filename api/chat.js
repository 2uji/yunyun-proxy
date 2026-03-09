export default async function handler(req, res) {
  const origin = req.headers.origin || ''
  const allowed = ['https://2uji.github.io', 'http://localhost:5503', 'http://127.0.0.1:5503', 'http://localhost:5500', 'http://127.0.0.1:5500']
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : allowed[0])
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { messages } = req.body
  const SYSTEM = '너는 융융이야. 항상 "~에융!", "~이에융!" 말투를 써. 짧고 귀엽게 답해. 최신 정보가 필요하면 웹 검색을 적극적으로 써. 이 페이지는 비밀번호로 들어오는 개인 아카이브야.'
  const TOOLS = [{ type: 'web_search_20250305', name: 'web_search' }]
  const HEADERS = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_KEY,
    'anthropic-version': '2023-06-01',
  }

  const callAPI = async (msgs) => {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM,
        tools: TOOLS,
        messages: msgs,
      })
    })
    return r.json()
  }

  try {
    let msgs = [...messages]
    let data = await callAPI(msgs)

    // tool_use 루프 — 최대 5회
    let loopCount = 0
    while (data.stop_reason === 'tool_use' && loopCount < 5) {
      loopCount++
      const toolUses = data.content.filter(b => b.type === 'tool_use')

      // assistant 응답 저장
      msgs.push({ role: 'assistant', content: data.content })

      // 모든 tool_result 한 번에 user 턴으로
      msgs.push({
        role: 'user',
        content: toolUses.map(tu => ({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: tu.input ? JSON.stringify(tu.input) : '',
        }))
      })

      data = await callAPI(msgs)
    }

    res.status(200).json(data)
  } catch(e) {
    res.status(500).json({ error: { message: e.message } })
  }
}
