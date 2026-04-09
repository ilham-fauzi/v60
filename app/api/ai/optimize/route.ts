import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { feedback, recipe, sessionData } = await req.json()

    if (!feedback) {
      return new Response(JSON.stringify({ error: 'feedback is required' }), { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are an expert coffee extraction specialist. Analyze this brew and suggest improvements.

Current Recipe:
- Method: ${recipe?.method || 'V60'}
- Coffee: ${recipe?.coffeeGrams || 15}g
- Water: ${recipe?.waterGrams || 225}g  
- Temperature: ${recipe?.temperature || 93}°C
- Grind Size: ${recipe?.grindSize || 'medium_fine'}

Sensory Feedback:
- Sweetness: ${feedback.sweetness}/5
- Acidity: ${feedback.acidity}/5
- Bitterness: ${feedback.bitterness}/5
- Body: ${feedback.body}/5
- Overall: ${feedback.overallScore}/5
${feedback.notes ? `- Notes: "${feedback.notes}"` : ''}

Provide 2-4 specific parameter adjustments as JSON:
{
  "diagnosis": string (one sentence describing the extraction issue),
  "optimizations": [
    {
      "parameter": string (e.g. "Temperature", "Grind Size", "Water Ratio"),
      "previousValue": string,
      "suggestedValue": string,
      "reason": string (specific scientific reason)
    }
  ],
  "nextBrewNote": string (one actionable tip for next brew)
}

Be specific with numbers (e.g. "Decrease temperature by 3°C to 90°C").
Respond ONLY with valid JSON, no markdown.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    let parsed
    try {
      parsed = JSON.parse(text.trim())
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      else throw new Error('Invalid JSON from Gemini')
    }

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
