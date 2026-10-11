import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('HTTP app serves the UI and executes local NLP without an external AI service', async () => {
  const child = spawn(process.execPath, ['server.js'], { cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: '3109', OLLAMA_URL: 'http://127.0.0.1:1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(() => { throw new Error('Server failed to start'); }), new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Startup timed out')), 5000); timer.unref(); })]);
    const root = await fetch('http://127.0.0.1:3109');
    assert.equal(root.status, 200);
    assert.equal(root.headers.get('cache-control'), 'no-cache');
    assert.ok((await root.text()).includes('Find my little adventure'));
    const health = await fetch('http://127.0.0.1:3109/api/health');
    assert.equal((await health.json()).engine, 'wink-nlp');
    const response = await fetch('http://127.0.0.1:3109/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'No birds, I want to walk', energy: 'medium', enhance: true }) });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.id, 'walk');
    assert.equal(result.ai.enhancement, 'unavailable');
    assert.ok(result.enhancementNotice);
    const invalid = await fetch('http://127.0.0.1:3109/api/plan', { method: 'POST', body: 'invalid' });
    assert.equal(invalid.status, 400);
    const privateFile = await fetch('http://127.0.0.1:3109/%2e%2e%2fpackage.json');
    assert.equal(privateFile.status, 403);
  } finally { child.kill(); await once(child, 'exit'); }
});
