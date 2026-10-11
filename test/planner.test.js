import test from 'node:test';
import assert from 'node:assert/strict';
import { plan } from '../planner.js';

test('trained model lemmatizes inflected verbs for activity selection', () => {
  const result = plan({ prompt: 'I am running and exercising', energy: 'high' });
  assert.equal(result.id, 'walk');
  assert.ok(result.ai.signals.includes('run'));
  assert.ok(result.ai.contentWords.includes('exercise'));
});
test('birding matches the bird activity', () => {
  assert.equal(plan({ prompt: 'I enjoy birding' }).id, 'bird');
});
test('negated plural preferences do not win', () => {
  assert.equal(plan({ prompt: 'No birds, I want to walk', energy: 'medium' }).id, 'walk');
});
test('quiet low-energy plan fits stated time and setting', () => {
  const result = plan({ prompt: 'Tired and quiet', minutes: 5, energy: 'low', place: 'park' });
  assert.equal(result.id, 'listen');
  assert.equal(result.minutes, 5);
  assert.ok(result.places.includes('park'));
  assert.equal(result.steps.length, 3);
});
test('garden preference respects available surroundings', () => {
  assert.equal(plan({ prompt: 'I want to garden', place: 'garden', energy: 'low' }).id, 'garden');
});
test('empty and malformed options produce a usable default', () => {
  const result = plan({ prompt: 42, minutes: -100, energy: 'invalid', place: 'moon' });
  assert.equal(result.minutes, 15);
  assert.equal(result.place, 'neighborhood');
  assert.equal(result.ai.tokensAnalyzed, 0);
  assert.ok(result.title);
});
