# Touch Grass — your next little adventure

I built **Touch Grass**, a tiny local AI planner that turns “I’ve been staring at my screen all day” into a doable outdoor break.

Tell it your mood, how much time you have, your energy, and what’s nearby. It gives you one small adventure: listen for birds, hunt for a color, check on a growing plant, take a walking catch-up, or simply find a quiet corner. Three steps and one thing to notice. Then it asks you to lock your screen and go outside. When you return, you can keep a small reflection, stored only in your browser.

**Open innovation is what makes this work.** The MIT-licensed wink-nlp English model runs locally to understand word forms and match interests. “Running” and “run” don’t need separate prompts or a paid API call. Model signals feed an inspectable activity ranker. The default app runs on a laptop with no internet after installation, costs no API fees, and sends no requests to a third-party AI provider. I can change its activity library, inspect its decisions, or swap in an open-weight model through Ollama.

A closed cloud model would add a network dependency, a place for sensitive mood text to travel, and ongoing inference costs. For this bounded task, a small open NLP model and transparent rules are enough. It doesn’t need to generate a thousand-word itinerary. It needs to help you leave the screen.

**Built with:** Node.js, vanilla HTML/CSS/JavaScript, wink-nlp, wink-eng-lite-web-model, and optional Ollama.

**One small plan. Then put the phone away.**

---

## 60-second demo

1. Show the home screen: “A little less screen. A little more world.”
2. Enter “I’m tired and want a quiet break.” Pick 5 minutes, low energy, and a park.
3. Generate the plan. Point out its three steps and the local AI explanation.
4. Download the plan, then click “I’m heading outside”. Show the screen-away view.
5. Click “I’m back”, add “I heard the wind in the trees,” and save.
6. Open “My moments” to show the local journal and explain that reflections stay in the browser.

Before posting, attach your repository or live-demo link and a screenshot or recording. This document is a draft; it has not been posted. The default NLP workflow is tested. Optional live Ollama inference has not been verified here.
