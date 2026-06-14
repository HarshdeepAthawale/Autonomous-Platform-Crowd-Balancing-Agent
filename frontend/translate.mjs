import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = 'AQ.Ab8RN6JWYmO_71ZewEoq4UvuUIq-fR15tDAqnt1Fa6sr8JJAfw';

const en = JSON.parse(readFileSync(resolve(__dirname, 'src/lib/i18n/strings.json'), 'utf-8'));

async function translateTo(lang, langName) {
  const entries = Object.entries(en);
  const lines = entries.map(([k, v]) => `"${k}": "${v.replace(/"/g, '\\"')}"`).join('\n');

  const prompt = `You are a professional translator. Translate the following JSON of UI strings from English to ${langName} (${lang}). 

Rules:
- Preserve ALL keys exactly as-is
- Keep placeholders like {count}, {id}, {min}, {step}, {n} UNCHANGED — do not translate them
- Keep HTML-like tags, special characters, and formatting UNCHANGED
- Use natural, native ${langName} that sounds like a real product UI
- Railway/station terminology should use correct local terms
- Return ONLY valid JSON, no markdown, no explanation
- The output must be parseable by JSON.parse()

English JSON:
${JSON.stringify(en, null, 2)}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();

  let translations;
  try {
    translations = JSON.parse(cleaned);
  } catch {
    console.error(`Failed to parse ${lang} response. Raw:`);
    console.error(cleaned);
    // Try to fix common issues — Gemini sometimes wraps keys in extra quotes
    const fixed = cleaned.replace(/(\w+):/g, '"$1":');
    try {
      translations = JSON.parse(fixed);
    } catch {
      throw new Error(`Could not parse ${lang} translation`);
    }
  }

  // Ensure all keys from English are present
  for (const key of Object.keys(en)) {
    if (!(key in translations)) {
      console.warn(`Missing key in ${lang}: ${key}`);
      translations[key] = en[key];
    }
  }

  return translations;
}

async function main() {
  console.log('Translating to Japanese...');
  const ja = await translateTo('ja', 'Japanese');
  writeFileSync(resolve(__dirname, 'src/lib/i18n/ja.json'), JSON.stringify(ja, null, 2), 'utf-8');
  console.log('✓ ja.json written');

  console.log('Translating to Hindi...');
  const hi = await translateTo('hi', 'Hindi');
  writeFileSync(resolve(__dirname, 'src/lib/i18n/hi.json'), JSON.stringify(hi, null, 2), 'utf-8');
  console.log('✓ hi.json written');

  console.log('All translations complete!');
}

main().catch(console.error);
