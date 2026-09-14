/* HabitPals — focused beta app
 * The UI is intentionally dependency-light and mobile-first.
 * Data is persisted locally for now; Firebase sync is a later milestone.
 */
(function () {
    'use strict';

    const Core = window.HabitPalsCore;
    if (!Core) throw new Error('HabitPalsCore is required');

    const STORAGE_KEY = 'habitPals';
    const DATE = Core.localDateKey;
    const animals = ['fox', 'owl', 'cat', 'panda', 'dog', 'capybara', 'rabbit', 'bear'];
    const animalNames = {
        fox: 'Fox', owl: 'Owl', cat: 'Cat', panda: 'Panda', dog: 'Dog',
        capybara: 'Capybara', rabbit: 'Rabbit', bear: 'Bear'
    };

    const seedHabits = [
        { id: 'read', name: 'Read 20 min', description: 'Give your brain some good fuel.', category: 'learning', xp: 20, mascotId: 'owl' },
        { id: 'exercise', name: 'Exercise', description: 'Move your body and boost your energy.', category: 'health', xp: 25, mascotId: 'dog' },
        { id: 'deep-work', name: 'Deep Work', description: 'One focused block with no distractions.', category: 'productivity', xp: 25, mascotId: 'fox' },
        { id: 'sleep', name: 'Sleep 7+ hours', description: 'Protect tomorrow by resting today.', category: 'wellness', xp: 20, mascotId: 'cat' },
        { id: 'plan', name: 'Plan the Day', description: 'Decide what matters before the day decides for you.', category: 'productivity', xp: 15, mascotId: 'panda' },
        { id: 'learn', name: 'Learn Something', description: 'A little progress compounds.', category: 'learning', xp: 20, mascotId: 'rabbit' }
    ];

    let engine;
    let selectedDate = DATE();
    let activeView = 'dashboard';

    function loadEngine() {
        let raw = null;
        try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
        engine = Core.HabitEngine.fromLegacy(raw, seedHabits);
        // If the previous prototype had no useful habits, seed them.
        if (!engine.getAllHabits().length) {
            seedHabits.forEach(h => engine.createHabit(h));
        }
        engine.recalculateXP();
        persist();
    }

    function persist() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(engine.serialize())); } catch (_) {}
    }

    function $(id) { return document.getElementById(id); }
    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
    }

    function mascotSvg(animal, mood, size) {
        const s = size || 88;
        const palettes = {
            fox: ['#F97316','#FFF7ED'], owl: ['#8B5CF6','#F5F3FF'], cat: ['#64748B','#F8FAFC'],
            panda: ['#202124','#FFFFFF'], dog: ['#A16207','#FEF3C7'], capybara: ['#A87850','#FFF7ED'],
            rabbit: ['#EC4899','#FDF2F8'], bear: ['#8B5E3C','#FFF7ED']
        };
        const p = palettes[animal] || palettes.fox;
        const happy = mood === 'happy' || mood === 'excited';
        const sad = mood === 'sad';
        const eyeY = happy ? 38 : 40;
        const mouth = happy
            ? '<path d="M34 51 Q44 61 54 51" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>'
            : sad
                ? '<path d="M34 57 Q44 48 54 57" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>'
                : '<path d="M37 53 Q44 56 51 53" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>';
        const eyes = happy
            ? `<path d="M31 ${eyeY} Q35 ${eyeY-5} 39 ${eyeY}" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/><path d="M49 ${eyeY} Q53 ${eyeY-5} 57 ${eyeY}" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>`
            : `<circle cx="35" cy="${eyeY}" r="3" fill="#1f2937"/><circle cx="53" cy="${eyeY}" r="3" fill="#1f2937"/>`;
        let ears = '<path d="M22 27 L25 9 L38 23 Z M50 23 L63 9 L66 27 Z" fill="'+p[0]+'"/>';
        if (animal === 'owl') ears = '<path d="M20 28 Q23 9 37 20 Q44 15 51 20 Q65 9 68 28 Z" fill="'+p[0]+'"/>';
        if (animal === 'rabbit') ears = '<ellipse cx="31" cy="14" rx="7" ry="16" fill="'+p[0]+'"/><ellipse cx="57" cy="14" rx="7" ry="16" fill="'+p[0]+'"/>';
        const muzzle = ['dog','cat','bear','capybara','panda'].includes(animal) ? `<ellipse cx="44" cy="49" rx="17" ry="13" fill="${p[1]}" opacity=".92"/>` : '';
        const blush = happy ? '<circle cx="26" cy="49" r="4" fill="#fb7185" opacity=".35"/><circle cx="62" cy="49" r="4" fill="#fb7185" opacity=".35"/>' : '';
        const badge = mood === 'excited' ? '<path d="M72 15 l4 7 7 1-5 5 1 7-7-4-7 4 1-7-5-5 7-1z" fill="#FBBF24"/>' : '';
        return `<svg class="mascot-svg" width="${s}" height="${s}" viewBox="0 0 88 88" aria-hidden="true">${ears}<circle cx="44" cy="43" r="29" fill="${p[0]}"/><ellipse cx="44" cy="51" rx="25" ry="21" fill="${p[1]}" opacity=".16"/>${muzzle}${eyes}${mouth}${blush}${badge}</svg>`;
    }

    function moodFor(habit) {
        if (engine.isComplete(habit.id, selectedDate)) return engine.currentStreak(habit.id, selectedDate) >= 3 ? 'excited' : 'happy';
        const streak = engine.currentStreak(habit.id, selectedDate);
        if (streak === 0 && selectedDate < DATE()) return 'sad';
        return 'neutral';
    }

    function moodLabel(mood) {
        return ({ excited:'On fire!', happy:'Proud of you!', neutral:'Ready when you are', sad:'Misses you' })[mood];
    }

    function renderHabits() {
        const grid = $('habits-grid');
        if (!grid) return;
        const habits = engine.getAllHabits();
        grid.innerHTML = habits.map(h => {
            const mood = moodFor(h);
            const done = engine.isComplete(h.id, selectedDate);
            const streak = engine.currentStreak(h.id, selectedDate);
            return `<article class="habit-card habit-card--${mood} ${done ? 'is-complete' : ''}" data-habit-id="${esc(h.id)}">
                <button class="mascot-button" data-toggle-habit="${esc(h.id)}" aria-label="${done ? 'Undo' : 'Complete'} ${esc(h.name)}">
                    <span class="mascot-orb">${mascotSvg(h.mascotId, mood, 94)}</span>
                    ${done ? '<span class="done-check">✓</span>' : ''}
                </button>
                <div class="habit-card-body">
                    <div class="habit-card-top"><h4>${esc(h.name)}</h4><span class="xp-pill">+${h.xp} XP</span></div>
                    <p>${esc(h.description)}</p>
                    <div class="habit-meta"><span>🔥 ${streak} day${streak === 1 ? '' : 's'}</span><span>${esc(moodLabel(mood))}</span></div>
                </div>
            </article>`;
        }).join('');
        grid.querySelectorAll('[data-toggle-habit]').forEach(btn => btn.addEventListener('click', () => toggleHabit(btn.dataset.toggleHabit)));
    }

    function toggleHabit(id) {
        engine.toggleCompletion(id, selectedDate);
        persist();
        renderAll();
    }

    function renderStats() {
        const habits = engine.getAllHabits();
        const xp = engine.state.xp;
        const level = engine.level();
        const daily = engine.dailyProgress(selectedDate);
        const best = habits.reduce((max, h) => Math.max(max, engine.bestStreak(h.id)), 0);
        if ($('current-level')) $('current-level').textContent = level;
        if ($('total-xp')) $('total-xp').textContent = xp;
        if ($('best-streak')) $('best-streak').textContent = best;
        if ($('daily-progress')) $('daily-progress').textContent = Math.round(daily * 100) + '%';
        if ($('demo-user-level')) $('demo-user-level').textContent = level;
        if ($('user-level')) $('user-level').textContent = level;
        if ($('xp-progress-text')) $('xp-progress-text').textContent = `${engine.xpIntoLevel()} / ${Core.XP_PER_LEVEL}`;
        if ($('xp-fill')) $('xp-fill').style.width = `${engine.xpIntoLevel()}%`;
        if ($('habit-date')) $('habit-date').value = selectedDate;
        if ($('date-status')) $('date-status').textContent = selectedDate === DATE() ? "Viewing today's habits" : `Viewing ${selectedDate}`;
    }

    function renderBoss() {
        const days = new Set();
        engine.weeklySummary().forEach(d => { if (d.completed > 0) days.add(d.date); });
        const count = Math.min(7, days.size);
        if ($('boss-fill')) $('boss-fill').style.width = `${Math.min(100, count / 5 * 100)}%`;
        if ($('boss-text')) $('boss-text').textContent = `${count}/5 days completed`;
        const card = $('boss-card');
        if (card) card.classList.toggle('boss-defeated', count >= 5);
    }

    function renderProgress() {
        const body = $('habit-stats-body');
        if (!body) return;
        body.innerHTML = engine.getAllHabits().map(h => `<div class="stats-row"><div>${mascotSvg(h.mascotId, moodFor(h), 40)}<span>${esc(h.name)}</span></div><div>${engine.currentStreak(h.id)}d</div><div>${engine.bestStreak(h.id)}d</div><div>${Math.round(engine.completionRate(h.id) * 100)}%</div></div>`).join('');
        const achievements = $('achievements-grid');
        if (achievements) {
            const total = engine.state.xp;
            const best = engine.getAllHabits().reduce((m,h)=>Math.max(m,engine.bestStreak(h.id)),0);
            const badges = [
                ['🌱','First Step','Complete your first habit', total > 0],
                ['🔥','On a Roll','Reach a 3-day streak', best >= 3],
                ['⚡','Power Week','Earn 500 XP', total >= 500],
                ['🏆','Consistency','Reach a 7-day streak', best >= 7]
            ];
            achievements.innerHTML = badges.map(b => `<div class="achievement-card ${b[3]?'unlocked':''}"><div class="achievement-icon">${b[0]}</div><div><strong>${b[1]}</strong><p>${b[2]}</p></div></div>`).join('');
        }
        renderChart();
    }

    function renderChart() {
        const canvas = $('progress-chart');
        if (!canvas || !window.Chart) return;
        if (window.habitPalsChart) window.habitPalsChart.destroy();
        const week = engine.weeklySummary();
        window.habitPalsChart = new Chart(canvas, { type:'bar', data:{ labels:week.map(x=>x.date.slice(5)), datasets:[{ label:'Completed habits', data:week.map(x=>x.completed), borderRadius:8 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{precision:0}}} } });
    }

    function renderManagement() {
        const box = $('habits-management');
        if (!box) return;
        box.innerHTML = engine.getAllHabits().map(h => `<div class="habit-management-row"><div class="management-mascot">${mascotSvg(h.mascotId,'neutral',48)}</div><div class="management-copy"><strong>${esc(h.name)}</strong><span>${esc(h.category)} · ${h.xp} XP</span></div><button class="btn btn--outline btn--sm" data-archive="${esc(h.id)}">Remove</button></div>`).join('');
        box.querySelectorAll('[data-archive]').forEach(b => b.addEventListener('click', () => { engine.archiveHabit(b.dataset.archive); persist(); renderAll(); }));
    }

    function addHabit() {
        const name = $('new-habit-name')?.value.trim();
        if (!name) return alert('Give your habit a name first.');
        engine.createHabit({ name, description:$('new-habit-desc')?.value || '', xp:$('new-habit-xp')?.value || 20, category:$('new-habit-category')?.value || 'general', mascotId:animals[engine.getAllHabits().length % animals.length] });
        ['new-habit-name','new-habit-desc'].forEach(id => { if ($(id)) $(id).value=''; });
        persist(); renderAll();
        document.querySelector('[data-view="dashboard"]')?.click();
    }

    function renderMascotSettings() {
        const box = $('mascot-settings');
        if (!box) return;
        box.innerHTML = engine.getAllHabits().map(h => `<div class="mascot-setting-row"><div>${mascotSvg(h.mascotId,'happy',56)}</div><div><strong>${esc(h.name)}</strong><select data-mascot-for="${esc(h.id)}">${animals.map(a=>`<option value="${a}" ${a===h.mascotId?'selected':''}>${animalNames[a]}</option>`).join('')}</select></div></div>`).join('');
        box.querySelectorAll('[data-mascot-for]').forEach(s => s.addEventListener('change', () => { engine.updateHabit(s.dataset.mascotFor,{mascotId:s.value}); persist(); renderAll(); }));
    }

    function renderReflection() {
        const week = engine.weeklySummary();
        const rates = engine.getAllHabits().map(h => ({h, r:engine.completionRate(h.id,7)})).sort((a,b)=>b.r-a.r);
        if ($('most-consistent')) $('most-consistent').textContent = rates[0] ? rates[0].h.name : '—';
        if ($('needs-attention')) $('needs-attention').textContent = rates[rates.length-1] ? rates[rates.length-1].h.name : '—';
        const bestDay = [...week].sort((a,b)=>b.completed-a.completed)[0];
        if ($('best-day')) $('best-day').textContent = bestDay ? bestDay.date : '—';
        if ($('mascot-mood')) $('mascot-mood').textContent = `${Math.round(engine.dailyProgress()*100)}% of today's companions are smiling.`;
        if ($('reflection-date')) $('reflection-date').textContent = `Week ending ${DATE()}`;
    }

    function renderAll() {
        renderStats(); renderHabits(); renderBoss(); renderProgress(); renderManagement(); renderMascotSettings(); renderReflection();
    }

    function showView(view) {
        activeView = view;
        document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `${view}-view`));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
        window.scrollTo({top:0, behavior:'smooth'});
    }

    function enterApp() {
        $('welcome-screen')?.classList.add('hidden');
        $('main-app')?.classList.remove('hidden');
        renderAll();
    }

    function setup() {
        loadEngine();
        $('demo-mode')?.addEventListener('click', enterApp);
        document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
        $('today-btn')?.addEventListener('click', () => { selectedDate = DATE(); renderAll(); });
        $('habit-date')?.addEventListener('change', e => { selectedDate = e.target.value || DATE(); renderAll(); });
        $('add-habit-btn')?.addEventListener('click', addHabit);
        $('theme-toggle')?.addEventListener('click', () => document.body.classList.toggle('dark-mode'));
        $('sign-out-btn')?.addEventListener('click', () => { localStorage.removeItem('habitPalsUser'); location.reload(); });
        window.handleCredentialResponse = response => {
            try {
                const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
                localStorage.setItem('habitPalsUser', JSON.stringify({name:payload.name,email:payload.email,picture:payload.picture}));
                enterApp();
            } catch (_) { enterApp(); }
        };
        const user = JSON.parse(localStorage.getItem('habitPalsUser') || 'null');
        if (user) {
            $('google-user-profile')?.classList.remove('hidden'); $('demo-user-info')?.classList.add('hidden');
            if ($('user-name')) $('user-name').textContent = user.name || 'HabitPal';
            if ($('user-avatar')) $('user-avatar').src = user.picture || '';
        }
    }

    document.addEventListener('DOMContentLoaded', setup);
})();
