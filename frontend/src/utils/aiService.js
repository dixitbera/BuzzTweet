/**
 * AI Service - OpenRouter API integration for post generation
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct"; // free model, can be changed

/**
 * Generate a social media post based on a user prompt/keyword.
 * @param {string} prompt - User's input (keyword, sentence, idea, etc.)
 * @returns {Promise<string>} - Generated post text
 */
export async function generatePost(prompt) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey || apiKey === "your_openrouter_api_key_here") {
    throw new Error(
      "OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your .env file."
    );
  }

  const systemPrompt = `You are a creative social media post writer for a Twitter-like platform called BuzzTweet.
Your task is to generate an engaging, concise, and catchy social media post based on the user's input.

Rules:
- Keep it under 280 characters
- Make it engaging and authentic
- Use relevant emojis sparingly (1-3 max)
- Do NOT include hashtags unless specifically asked
- NEVER wrap your response in quotation marks (no " or ' around the text)
- Do NOT start or end with any kind of quote character
- Return ONLY the raw post text — no explanations, no formatting, no surrounding quotes of any kind`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "BuzzTweet AI Post Generator",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a social media post about: ${prompt}` },
      ],
      max_tokens: 150,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `API request failed with status ${response.status}`
    );
  }

  const data = await response.json();
  let generated = data?.choices?.[0]?.message?.content?.trim();

  if (!generated) {
    throw new Error("No content was generated. Please try again.");
  }

  // Strip any leading/trailing quote characters the model may have added
  generated = generated.replace(/^["'""'']+|["'""'']+$/g, "").trim();

  // Trim to 280 chars just in case
  return generated.length > 280 ? generated.substring(0, 277) + "..." : generated;
}
