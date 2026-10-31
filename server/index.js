// StockWise API server — keeps the AI key off the browser.
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(express.json({ limit: '15mb' }));

const PORT = process.env.PORT || 3001;
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: Boolean(KEY), model: KEY ? MODEL : null });
});

const PROMPT = (products) => `You are reading a photo of a supplier delivery order or invoice for a small business.
Extract every product line item. Then match each line to the business's existing product list where it is clearly the same item (abbreviations, different word order, US/UK spelling and pack-size notation like "100'S" are common). Only match when you are confident it is the same item; otherwise use null.

Existing products (id | name | code):
${products.map((p) => `${p.id} | ${p.name} | ${p.code}`).join('\n')}

Respond with ONLY valid JSON, no markdown, in this exact shape:
{
  "supplier": string | null,
  "documentNo": string | null,
  "date": "YYYY-MM-DD" | null,
  "lines": [
    { "description": string, "quantity": number, "unit": string | null,
      "matchProductId": string | null, "confidence": number }
  ]
}
"confidence" is 0 to 1 for the match (0 if matchProductId is null). Ignore totals, taxes, prices and signatures.`;

app.post('/api/extract-delivery-note', async (req, res) => {
  if (!KEY) return res.status(503).json({ error: 'AI key not configured', demo: true });
  const { image, products = [] } = req.body || {};
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(image || '');
  if (!m) return res.status(400).json({ error: 'Send the photo as a base64 data URL in "image".' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
            { type: 'text', text: PROMPT(products) },
          ],
        }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'AI request failed' });
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    res.json({ ...json, model: MODEL });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not read this document. Try a clearer, well-lit photo.' });
  }
});

// Serve the built web app in production
if (process.env.NODE_ENV === 'production' || process.argv.includes('--prod')) {
  const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`StockWise API on http://localhost:${PORT}  (${KEY ? `AI: ${MODEL}` : 'Demo mode — no AI key'})`);
});
