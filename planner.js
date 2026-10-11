import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

const nlp = winkNLP(model);
const { its } = nlp;
const catalog = [
  { id: 'listen', title: 'Find your quiet corner', category: 'Slow down', places: ['park', 'neighborhood', 'garden'], energy: 1, tags: ['quiet', 'stress', 'tired', 'calm', 'relax', 'anxious', 'overwhelm'], description: 'A tiny listening walk. No destination, no headphones. Just you and what’s already here.', steps: ['Walk to a familiar, public outdoor spot.', 'Pause somewhere comfortable. Listen for three sounds at different distances.', 'Take five slow breaths, then return at your own pace.'], noticing: 'Which sound did you only notice after standing still?' },
  { id: 'color', title: 'Go on a color hunt', category: 'Notice more', places: ['park', 'neighborhood', 'trail', 'garden'], energy: 2, tags: ['creative', 'color', 'art', 'photo', 'bored', 'explore'], description: 'Pick one color. Let it lead you through the little details you usually walk past.', steps: ['Choose a color before you leave; keep your phone in your pocket.', 'Walk a familiar route and find five different versions of that color.', 'On your way back, choose one detail you’d like to remember.'], noticing: 'What ordinary thing looked different today?' },
  { id: 'bird', title: 'Meet the neighborhood choir', category: 'Wild things', places: ['park', 'trail', 'garden', 'neighborhood'], energy: 1, tags: ['bird', 'birding', 'wildlife', 'nature', 'listen'], description: 'A gentle bird-listening break. You don’t need to know their names to enjoy their company.', steps: ['Find a public spot near trees, away from traffic if possible.', 'Stand or sit quietly for a few minutes. Count different call patterns.', 'Watch from a distance. Leave nests and wildlife undisturbed.'], noticing: 'Did the calls change when you became still?' },
  { id: 'walk', title: 'Take the long way home', category: 'Get moving', places: ['neighborhood', 'park', 'trail'], energy: 3, tags: ['walk', 'exercise', 'run', 'active', 'move', 'restless', 'fitness'], description: 'Give your legs a little adventure on a route you already know.', steps: ['Pick a familiar out-and-back route with a safe place to turn around.', 'Walk at a comfortable pace. Turn back halfway through your available time.', 'Ease your pace for the last few minutes and notice how you feel.'], noticing: 'What changed between the first minute and the last?' },
  { id: 'garden', title: 'Check in with something growing', category: 'Small rituals', places: ['garden', 'park'], energy: 1, tags: ['garden', 'plant', 'grow', 'flower', 'soil', 'gardening'], description: 'A slow visit with a plant. Your own garden, or a public green space, is enough.', steps: ['Choose a plant you can observe without stepping off a path.', 'Look closely at a leaf, its texture, and any new growth.', 'If it’s your plant, check the soil before deciding whether it needs water.'], noticing: 'What small sign of growth can you find?' },
  { id: 'company', title: 'Make it a walking catch-up', category: 'Better together', places: ['neighborhood', 'park', 'trail'], energy: 2, tags: ['friend', 'social', 'company', 'lonely', 'together', 'club'], description: 'Trade a scrolling session for a short walk with someone you like.', steps: ['Invite a friend for a short walk on a familiar public route.', 'Agree on a meeting spot and a turnaround time.', 'Ask each other one question you haven’t asked in a while.'], noticing: 'What did you learn that a text message might have missed?' },
];

export function plan(input = {}) {
  const text = typeof input.prompt === 'string' ? input.prompt.trim().slice(0, 600) : '';
  const doc = nlp.readDoc(text);
  const lemmas = doc.tokens().out(its.lemma).map(x => x.toLowerCase());
  const terms = new Set(lemmas);
  const pos = doc.tokens().out(its.pos);
  const explicitMinutes = Number(input.minutes);
  const mentionedMinutes = text.match(/\b(5|10|15|20|30|45|60)\s*(?:min|minute)/i);
  const minutes = [5, 10, 15, 20, 30, 45, 60].includes(explicitMinutes) ? explicitMinutes : mentionedMinutes ? Number(mentionedMinutes[1]) : 15;
  const place = ['park', 'neighborhood', 'trail', 'garden'].includes(input.place) ? input.place : 'neighborhood';
  const energy = ['low', 'medium', 'high'].includes(input.energy) ? input.energy : 'medium';
  const level = { low: 1, medium: 2, high: 3 }[energy];
  // Negation is interpreted conservatively within the current phrase.
  const excluded = new Set();
  const clauses = text.toLowerCase().split(/[.,;!?]|\bbut\b/);
  for (const clause of clauses) {
    if (/\b(no|not|don't|dont|avoid|without)\b/.test(clause)) {
      for (const activity of catalog) {
        const clauseTerms = new Set(nlp.readDoc(clause).tokens().out(its.lemma).map(x => x.toLowerCase()));
        for (const tag of activity.tags) if (clauseTerms.has(tag)) excluded.add(tag);
      }
    }
  }
  const scored = catalog.filter(a => a.places.includes(place)).map(a => {
    const matches = a.tags.filter(t => terms.has(t) && !excluded.has(t));
    const negative = a.tags.some(t => excluded.has(t));
    const score = matches.length * 10 + (a.energy <= level ? 3 : -5) + (a.energy === level ? 1 : 0) - (negative ? 30 : 0);
    return { ...a, score, matches };
  }).sort((a, b) => b.score - a.score);
  const selected = scored[0];
  const signals = selected.matches;
  return {
    ...selected, minutes, place, energy,
    reason: signals.length ? `Your words “${signals.join('”, “')}” pointed us here. Matched to ${energy} energy and ${minutes} minutes.` : `A ${energy}-energy break that fits ${minutes} minutes and your ${place}.`,
    safety: 'Choose a familiar, accessible public route. Check daylight and weather before leaving; adjust or stay in if conditions are unsafe.',
    alternatives: scored.slice(1, 3).map(a => ({ id: a.id, title: a.title, category: a.category })),
    ai: { engine: 'wink-nlp', model: 'wink-eng-lite-web-model', local: true, signals, tokensAnalyzed: lemmas.length, contentWords: lemmas.filter((_, i) => ['NOUN', 'VERB', 'ADJ'].includes(pos[i])).slice(0, 12) },
  };
}
