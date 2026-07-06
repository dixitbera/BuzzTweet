/**
 * AI Service — calls the backend proxy instead of OpenRouter directly.
 * The API key is kept server-side; this module never touches it.
 */

/**
 * Generate a social media post based on a user prompt/keyword.
 * @param {string} prompt - User's input (keyword, sentence, idea, etc.)
 * @returns {Promise<string>} - Generated post text
 */
export async function generatePost(prompt) {
  const apiUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${apiUrl}/api/ai/generate-post`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.message || `AI request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  if (!data?.generated) {
    throw new Error("No content was generated. Please try again.");
  }

  return data.generated;
}
