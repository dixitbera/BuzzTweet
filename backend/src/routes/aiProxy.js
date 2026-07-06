import express from "express";
import { authMiddleware } from "../middleware/Auth.js";

const router = express.Router();

/**
 * POST /api/ai/generate-post
 * Proxies the AI post-generation request to OpenRouter,
 * keeping the API key server-side (never exposed to the client).
 */
router.post("/generate-post", authMiddleware, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: "AI service is not configured" });
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

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "BuzzTweet AI Post Generator",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
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
      console.error("OpenRouter API error:", err);
      return res.status(502).json({
        message: err?.error?.message || "AI service request failed",
      });
    }

    const data = await response.json();
    let generated = data?.choices?.[0]?.message?.content?.trim();

    if (!generated) {
      return res.status(502).json({ message: "No content was generated" });
    }

    // Strip any leading/trailing quote characters the model may have added
    generated = generated.replace(/^["'""'']+|["'""'']+$/g, "").trim();

    // Trim to 280 chars just in case
    if (generated.length > 280) {
      generated = generated.substring(0, 277) + "...";
    }

    return res.status(200).json({ generated });
  } catch (error) {
    console.error("AI proxy error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
