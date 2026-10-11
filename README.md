# Touch Grass

**A little less screen. A little more world.**

A small outdoor activity planner powered by open-source, local NLP. Tell it how you feel, choose your time and energy, and get one doable adventure. Save the plan, lock your screen, and notice something outside.

[Deploy to Render](https://render.com/deploy?repo=https://github.com/swapnil-coder5/Touch-Grass)

## Run

Requires Node.js 22 or newer and npm. No API keys, database, account, or paid service required.

```sh
npm ci
npm test
npm start
```

The server listens on port 3000. Open that port in your browser on your own machine. `npm run dev` restarts the server on changes. Set `PORT` to change the listening port. The default flow works without internet **after dependency installation**, while the local Node server is running. There is no frontend build step.

## What works

- Mood-aware activity matching, including inflected words and simple negated preferences.
- Time, energy, and surroundings controls.
- Six curated activities: listening walks, color hunts, bird listening, movement, gardening, and walking catch-ups.
- Three concrete steps, a noticing prompt, and route/weather reminders.
- Downloadable text plan and a screen-away timer.
- Browser-only reflection journal with viewing and deletion.
- Responsive layout, keyboard-accessible controls, and model/ranking explanations.
- Optional Ollama encouragement; the local NLP plan still works if Ollama is unavailable.

## Open AI at the core

[wink-nlp](https://github.com/winkjs/wink-nlp) 2.4.0 and [wink-eng-lite-web-model](https://github.com/winkjs/wink-eng-lite-web-model) 1.8.1 (both MIT) run in the Node process. The English model analyzes tokens, lemmas, and parts of speech. Lemmas drive interest matching: “running” becomes “run”; “birding” becomes “bird”. A transparent ranker combines these model outputs with time, energy, and available surroundings. Activity steps are curated, not generated.

This is a **local NLP recommendation system**, not a large language model. It interprets a limited set of English preferences, not arbitrary conversation. It does not identify bird species, fetch live weather, or invent nearby venues. Simple negation is conservative and may over-exclude words in a phrase.

The open model makes useful language understanding cheap and inspectable. Self-hosting keeps planning text on a machine you control. There is no third-party AI request in the default flow; a hosted deployment does receive the planning request. Reflections stay in the browser’s local storage, capped at 30 moments. The app does not persist prompts on its server. Hosting providers may have their own request/access logs.

## Optional open-weight generation

On a machine with [Ollama](https://ollama.com/) installed:

```sh
ollama serve
# In another terminal:
ollama pull qwen2.5:0.5b
npm start
```

Check “Add a sentence from my local Ollama model”. The server sends the selected activity title and duration to Ollama; it does not send your mood text or saved reflections. Default endpoint: `http://127.0.0.1:11434`; override with `OLLAMA_URL`. Change the model using `OLLAMA_MODEL`. Check the chosen model’s license before redistribution. Qwen2.5 0.5B is an Apache-2.0 open-weight model. Successful live Ollama inference was **not validated in the cloud environment** because the download domains were blocked; fallback behavior was tested.

## Submit / host

See [SUBMISSION.md](SUBMISSION.md) for a ready-to-use post and a 60-second demo script. Screenshots are in `docs/`.

For Render, the included `render.yaml` defines a free Node web service, installs locked production dependencies, starts the app, and checks `/api/health`. The app respects Render's `PORT` and binds to `0.0.0.0`. Default NLP does not need Ollama.

## Validation

`npm test` runs seven checks, including model-based activity selection, plural negation, input defaults, real HTTP serving, malformed input, path traversal rejection, and graceful Ollama fallback. A Chromium walkthrough also verified desktop/mobile layout, plan download, timer, reflection persistence, viewing/deletion, and no browser JavaScript errors. Browser tooling is not a runtime dependency.

## Customize

Edit `catalog` in `planner.js` to add activities or interests. Scoring is explicit: matched lemmas carry the largest weight, energy affects preference, unavailable surroundings exclude activities, and negated interests reduce scores. The AI explanation shows the matching signals.

MIT license. Dependency licenses remain with their respective authors.
