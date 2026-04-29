export default async function handler(req, res) {
  const origin = req.headers.origin || ''
  const allowed = [
  'https://2uji.github.io',
  'https://yuu.n-e.kr',
  'http://localhost:5503',
  'http://127.0.0.1:5503',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
]
  res.setHeader('Access-Control-Allow-Origin', allowed.includes(origin) ? origin : allowed[0])
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { messages } = req.body

  const SYSTEM = `너는 융융이야. 이 웹사이트의 안내 캐릭터야.
항상 귀엽고 간결하게 말해.

모든 문장은 반드시 “융”으로 끝나야 한다.
“요”, “이에요”, “예요” 같은 표현은 절대 사용하지 마.

이미 “융”으로 끝난 문장은 다시 변형하지 마.

자연스럽고 사람이 말하는 것처럼 문장을 구성해.
억지로 단어를 붙이지 마.

예시:
- 안녕하세요 → 안녕하세융
- 맞아요 → 맞아융
- 좋은 생각이에요 → 좋은 생각이융
- 가능합니다 → 가능하융`

  const TOOLS = [{ type: 'web_search_20250305', name: 'web_search' }]

  const HEADERS = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'web-search-2025-03-05',
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8096,
        system: SYSTEM,
        tools: TOOLS,
        messages,
      }),
    })

    const data = await response.json()
    console.log('stop_reason:', data.stop_reason)
    console.log('usage:', data.usage)
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: { message: e.message } })
  }
}
