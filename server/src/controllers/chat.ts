import { Request, Response } from 'express';
import fetch from 'node-fetch';

interface GroqMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  id: string;
  choices: {
    message: GroqMessage;
    index: number;
    finish_reason: string;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.ai/v1';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export const chatProxy = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message' });

    // Basic validation
    if (typeof message !== 'string' || message.length > 2000) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    // Call GROQ API (as a proxy)
    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: message }],
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('GROQ API error:', response.status, text);
      return res.status(502).json({ error: 'Upstream error', details: text });
    }

    const data = await response.json() as GroqResponse;
    // Extract reply from GROQ response
    const reply = data.choices?.[0]?.message?.content ?? null;
    return res.json({ reply, raw: data });
  } catch (err) {
    console.error('chatProxy error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
