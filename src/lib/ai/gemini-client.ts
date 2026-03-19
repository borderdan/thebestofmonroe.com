/**
 * Gemini API Client
 * 
 * Wrapper for the Google AI Studio REST API with structured JSON output.
 * Uses responseMimeType: "application/json" and responseSchema for type-safe generation.
 */

interface GeminiConfig {
  model?: string
  temperature?: number
  maxOutputTokens?: number
}

interface GeminiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

const DEFAULT_MODEL = 'gemini-2.5-flash'

/**
 * Calls the Gemini API and returns structured JSON output.
 * 
 * @param prompt - The prompt to send
 * @param responseSchema - JSON Schema that the response must conform to
 * @param config - Optional model/temperature/token settings
 */
export async function generateStructuredJSON<T>(
  prompt: string,
  responseSchema: Record<string, unknown>,
  config?: GeminiConfig
): Promise<GeminiResponse<T>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY not configured' }
  }

  const model = config?.model || DEFAULT_MODEL
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: config?.temperature ?? 0.3,
          maxOutputTokens: config?.maxOutputTokens ?? 4096,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `Gemini API error (${response.status}): ${errorText}` }
    }

    const result = await response.json()
    let text = result?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error('Gemini API Error: No content returned', JSON.stringify(result, null, 2))
      return { success: false, error: 'No content returned from Gemini' }
    }

    // Clean up response: strip markdown code blocks if present
    text = text.trim()
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    try {
      const parsed = JSON.parse(text) as T
      return { success: true, data: parsed }
    } catch (parseErr) {
      console.error('Gemini JSON Parse Error at position:', (parseErr as Error).message)
      console.error('Raw text (first 500 chars):', text.slice(0, 500))
      console.error('Raw text (last 500 chars):', text.slice(-500))
      
      // Attempt to fix common issues like trailing commas before failing
      try {
        // Very basic trailing comma fix for objects/arrays
        const fixedText = text.replace(/,\s*([\]}])/g, '$1')
        const parsed = JSON.parse(fixedText) as T
        console.log('Successfully parsed JSON after stripping trailing commas')
        return { success: true, data: parsed }
      } catch (innerErr) {
        return {
          success: false,
          error: `Failed to parse generated JSON: ${(parseErr as Error).message}`,
        }
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to call Gemini API',
    }
  }
}
