const $ = id => document.getElementById(id);
let minutes = 15, energy = 'medium', currentPlan, endAt, clock;
const views = ['planner-view', 'result-view', 'outside-view', 'reflection-view'];
function show(id) { for (const view of views) $(view).hidden = view !== id; window.scrollTo({ top: 0, behavior: 'smooth' }); }
function stopClock() { clearInterval(clock); clock = undefined; }
for (const [id, update] of [['time-options', value => minutes = Number(value)], ['energy-options', value => energy = value]]) {
  $(id).addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    for (const item of $(id).querySelectorAll('button')) { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); }
    update(button.dataset.value);
  });
}
for (const button of document.querySelectorAll('[data-prompt]')) button.addEventListener('click', () => { $('prompt').value = button.dataset.prompt; $('prompt').focus(); });
$('plan-form').addEventListener('submit', async event => {
  event.preventDefault(); $('submit-button').disabled = true; $('submit-button').textContent = 'Finding your outside…'; $('error').hidden = true;
  try {
    const response = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: $('prompt').value, minutes, energy, place: $('place').value, enhance: $('enhance').checked }) });
    if (!response.ok) throw new Error('We couldn’t make a plan. Please try again.');
    currentPlan = await response.json();
    $('enhancement').hidden = !(currentPlan.encouragement || currentPlan.enhancementNotice);
    $('enhancement').textContent = currentPlan.encouragement || currentPlan.enhancementNotice || '';
    for (const [id, value] of Object.entries({ 'result-title': currentPlan.title, 'result-description': currentPlan.description, 'result-time': `${currentPlan.minutes} minutes`, 'result-category': currentPlan.category, 'result-reason': currentPlan.reason, 'result-noticing': currentPlan.noticing, 'result-safety': currentPlan.safety, 'ai-reason': `The local model analyzed ${currentPlan.ai.tokensAnalyzed} tokens${currentPlan.ai.signals.length ? ` and matched: ${currentPlan.ai.signals.join(', ')}` : ', then used your time, energy and surroundings'}.` })) $(id).textContent = value;
    $('result-steps').replaceChildren(...currentPlan.steps.map(step => { const li = document.createElement('li'); li.textContent = step; return li; }));
    show('result-view'); $('result-title').setAttribute('tabindex', '-1'); $('result-title').focus();
  } catch (error) { $('error').textContent = error.message; $('error').hidden = false; }
  finally { $('submit-button').disabled = false; $('submit-button').replaceChildren(document.createTextNode('Find my little adventure '), Object.assign(document.createElement('span'), { className: 'arrow' })); }
});
$('back-button').addEventListener('click', () => show('planner-view'));
$('start-button').addEventListener('click', () => {
  stopClock(); endAt = Date.now() + currentPlan.minutes * 60000;
  const tick = () => { const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000)); $('timer').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`; if (!remaining) stopClock(); };
  tick(); clock = setInterval(tick, 1000); show('outside-view');
});
$('cancel-button').addEventListener('click', () => { stopClock(); show('result-view'); });
$('return-button').addEventListener('click', () => { stopClock(); $('reflection').value = ''; $('saved-message').textContent = ''; show('reflection-view'); });
$('save-reflection').addEventListener('click', () => {
  if (!$('reflection').value.trim()) { $('saved-message').textContent = 'Write a little note first, or start another adventure.'; return; }
  try { const moments = JSON.parse(localStorage.getItem('touch-grass-moments') || '[]'); moments.push({ date: new Date().toISOString(), title: currentPlan.title, note: $('reflection').value.trim() }); localStorage.setItem('touch-grass-moments', JSON.stringify(moments.slice(-30))); $('saved-message').textContent = 'Saved in this browser. Your little moment is yours.'; }
  catch { $('saved-message').textContent = 'Browser storage is unavailable. You can copy your note to keep it.'; }
});
$('new-plan').addEventListener('click', () => show('planner-view'));
$('download-button').addEventListener('click', () => {
  const text = `${currentPlan.title}\n${currentPlan.minutes} minutes · ${currentPlan.category}\n\n${currentPlan.description}\n\n${currentPlan.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nNotice: ${currentPlan.noticing}\n\n${currentPlan.safety}\n\nMade with Touch Grass — local AI, open air.`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = 'my-little-adventure.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function renderMoments() {
  const list = $('moments-list'); list.replaceChildren();
  try {
    const notes = JSON.parse(localStorage.getItem('touch-grass-moments') || '[]');
    if (!notes.length) { const p = document.createElement('p'); p.textContent = 'Your first little adventure is waiting. Head outside, then save a note when you return.'; list.append(p); }
    for (const note of notes.slice().reverse()) {
      const article = document.createElement('article'); article.className = 'moment';
      const heading = document.createElement('strong'); heading.textContent = note.title;
      const date = document.createElement('small'); date.textContent = new Date(note.date).toLocaleDateString();
      const p = document.createElement('p'); p.textContent = note.note;
      article.append(heading, date, p); list.append(article);
    }
    $('clear-moments').hidden = !notes.length;
  } catch { list.textContent = 'Saved moments are unavailable in this browser.'; }
}
$('moments-button').addEventListener('click', () => { renderMoments(); $('moments-dialog').showModal(); });
$('close-moments').addEventListener('click', () => $('moments-dialog').close());
$('clear-moments').addEventListener('click', () => { localStorage.removeItem('touch-grass-moments'); renderMoments(); });
