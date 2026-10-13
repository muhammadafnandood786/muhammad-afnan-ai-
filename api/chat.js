// Vercel serverless endpoint for Muhammad Afnan AI chat.
// Set GEMINI_API_KEY in Vercel Project Settings -> Environment Variables.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    // A user may provide their own key in the app's password field. It is used
    // only for this request and is never written to storage or logs.
    const apiKey = (typeof body.apiKey === 'string' ? body.apiKey.trim() : '') || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Add your Gemini API key in Settings, or configure GEMINI_API_KEY on the server.'
      });
    }
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    if (!messages.length) return res.status(400).json({ error: 'Please send a message.' });

    const contents = [];
    for (const item of messages) {
      if (!item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string') continue;
      const text = item.text.trim().slice(0, 4000);
      if (!text) continue;
      const role = item.role === 'assistant' ? 'model' : 'user';
      // Gemini requires alternating user/model turns. Merge adjacent messages of the same role.
      const last = contents[contents.length - 1];
      if (last && last.role === role) last.parts[0].text += '\n\n' + text;
      else contents.push({ role, parts: [{ text }] });
    }

    while (contents.length && contents[0].role !== 'user') contents.shift();
    if (!contents.length) return res.status(400).json({ error: 'No valid user message was provided.' });

    const systemInstruction = [
      'You are Muhammad Afnan AI, a helpful, accurate, friendly multilingual assistant.',
      'Understand and respond naturally to English, Turkish, Urdu script, and Roman Urdu.',
      'Always answer in the language and writing script the user used most recently.',
      'If the user writes Roman Urdu, reply in natural Roman Urdu using Latin letters; do not switch to Hindi or Urdu script unless asked.',
      'If the user writes Urdu script, reply in Urdu script. If Turkish, reply in Turkish. If English, reply in English.',
      'Answer the actual question with useful details. If you are unsure or information may be outdated, say so clearly instead of inventing facts.',
      'Use concise, clear formatting. For coding requests, provide correct practical examples.'
    ].join(' ');

    const upstream = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1400 }
        }),
        signal: AbortSignal.timeout(45000)
      }
    );

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = upstream.status === 429
        ? 'AI usage limit reached. Please wait a little and try again.'
        : upstream.status === 401 || upstream.status === 403
          ? 'The AI API key was rejected. Check GEMINI_API_KEY in Vercel settings.'
          : 'The AI service could not complete this request. Please try again.';
      console.error('Gemini API error:', upstream.status, data?.error?.message || 'No details');
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: message });
    }

    const answer = (data.candidates || [])
      .flatMap(candidate => candidate.content?.parts || [])
      .map(part => part.text || '')
      .join('')
      .trim();

    if (!answer) return res.status(502).json({ error: 'The AI returned an empty answer. Please try again.' });
    return res.status(200).json({ reply: answer });
  } catch (error) {
    console.error('Chat backend error:', error?.message || error);
    return res.status(500).json({ error: 'Chat request failed. Please try again in a moment.' });
  }
}
