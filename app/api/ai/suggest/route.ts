import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { beanProfile, method, coffeeGrams } = await req.json()

    if (!beanProfile) {
      return new Response(JSON.stringify({ error: 'beanProfile is required' }), { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a world-class coffee barista and extraction scientist. 
A user wants to brew coffee with the following profile:
- Bean: ${beanProfile}
- Method: ${method || 'V60'}
- Coffee Amount: ${coffeeGrams || 15}g

Provide a precise brewing recipe in JSON format with this exact schema:
{
  "temperature": number (Celsius),
  "ratio": number (e.g. 15 for 1:15),
  "grindSize": "extra_fine"|"fine"|"medium_fine"|"medium"|"medium_coarse"|"coarse",
  "waterGrams": number,
  "stages": [
    { "name": string, "targetWeight": number, "targetSeconds": number, "notes": string }
  ],
  "reasoning": string (2-3 sentences on why these parameters),
  "tips": string[] (3 specific tips for this bean/method)
}

Focus on highlighting the bean's unique characteristics. Be precise and scientific.
Respond ONLY with valid JSON, no markdown.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse and validate JSON
    let parsed
    try {
      parsed = JSON.parse(text.trim())
    } catch {
      // Try to extract JSON from response
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
