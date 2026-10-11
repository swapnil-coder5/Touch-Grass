import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { plan } from './planner.js';

const root = path.resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
async function body(req) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 8192) throw new Error('Request too large'); }
  return JSON.parse(raw || '{}');
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/health' && req.method === 'GET') return json(res, 200, { ok: true, engine: 'wink-nlp', model: 'wink-eng-lite-web-model', offline: true });
    if (url.pathname === '/api/plan' && req.method === 'POST') {
      const input = await body(req);
      if (!input || typeof input !== 'object' || Array.isArray(input)) return json(res, 400, { error: 'Please send a planning request.' });
      const result = plan(input);
      if (input.enhance === true) {
        try {
          const response = await fetch(`${process.env.OLLAMA_URL || 'http://127.0.0.1:11434'}/api/generate`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000),
            body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'qwen2.5:0.5b', stream: false, prompt: `Write one encouraging sentence, at most 30 words, for this outdoor activity: ${result.title}. Duration ${result.minutes} minutes. No medical advice, invented locations, or safety guarantees.` }),
          });
          if (!response.ok) throw new Error('Model unavailable');
          const generated = await response.json();
          if (!generated.response?.trim()) throw new Error('Empty response');
          result.encouragement = generated.response.trim().slice(0, 400);
          result.ai.enhancement = 'Ollama';
        } catch { result.ai.enhancement = 'unavailable'; result.enhancementNotice = 'Ollama is unavailable. Your local NLP plan is ready.'; }
      }
      return json(res, 200, result);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' });
    const filename = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!filename.startsWith(root + path.sep)) return json(res, 403, { error: 'Forbidden' });
    const data = await readFile(filename);
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    json(res, error.code === 'ENOENT' ? 404 : 400, { error: error.code === 'ENOENT' ? 'Not found' : 'Could not read that request. Please try again.' });
  }
});
server.listen(port, '0.0.0.0', () => console.log(`Touch Grass running on port ${port}; local NLP ready.`));
