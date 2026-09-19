/* HabitPals v1.2 — Duolingo-style habit companion experience */
(function () {
  'use strict';

  const STORAGE_KEY = 'habitPals';
  const DATE = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const animals = ['fox','owl','cat','panda','dog','capybara','rabbit','bear'];
  const animalNames = {fox:'Fox',owl:'Owl',cat:'Cat',panda:'Panda',dog:'Dog',capybara:'Capybara',rabbit:'Rabbit',bear:'Bear'};
  const seedHabits = [
    {id:'read',name:'Read 20 min',description:'Give your brain some good fuel.',category:'learning',xp:20,mascotId:'owl'},
    {id:'exercise',name:'Exercise',description:'Move your body and boost your energy.',category:'health',xp:25,mascotId:'dog'},
    {id:'deep-work',name:'Deep Work',description:'One focused block with no distractions.',category:'productivity',xp:25,mascotId:'fox'},
    {id:'sleep',name:'Sleep 7+ hours',description:'Protect tomorrow by resting today.',category:'wellness',xp:20,mascotId:'cat'},
    {id:'plan',name:'Plan the Day',description:'Decide what matters before the day decides for you.',category:'productivity',xp:15,mascotId:'panda'},
    {id:'learn',name:'Learn Something',description:'A little progress compounds.',category:'learning',xp:20,mascotId:'rabbit'}
  ];

  let Core = window.HabitPalsCore;
  let engine, selectedDate = DATE(), activeView = 'dashboard', previousXP = 0;

  function loadCore(done) {
    if (Core) return done();
    const script = document.createElement('script');
    script.src = 'habit-engine.js';
    script.onload = () => { Core = window.HabitPalsCore; done(); };
    script.onerror = () => {
      document.body.innerHTML = '<main style="padding:32px;font-family:system-ui"><h2>HabitPals could not start</h2><p>Please refresh the page. If this keeps happening, check that habit-engine.js is published.</p></main>';
    };
    document.head.appendChild(script);
  }

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function injectV12Styles() {
    if ($('v12-styles')) return;
    const style = document.createElement('style');
    style.id = 'v12-styles';
    style.textContent = `
      :root { --hp-green:#58cc02; --hp-green-dark:#46a302; --hp-blue:#1cb0f6; --hp-yellow:#ffc800; --hp-red:#ff4b4b; --hp-ink:#263238; --hp-muted:#718096; --hp-card:#fff; --hp-bg:#f6f7fb; }
      body { background:var(--hp-bg); color:var(--hp-ink); }
      .main-nav { position:sticky; top:0; z-index:50; backdrop-filter:blur(14px); }
      .nav-container { max-width:1180px; }
      .dashboard-welcome { border-radius:24px; padding:24px; background:linear-gradient(135deg,#fff 0%,#f1f9ed 100%); border:1px solid #e6eedf; box-shadow:0 8px 30px rgba(31,42,52,.06); }
      .stats-grid { gap:12px; }
      .stat-card { border-radius:18px; transition:transform .2s ease, box-shadow .2s ease; }
      .stat-card:hover { transform:translateY(-2px); box-shadow:0 10px 24px rgba(31,42,52,.08); }
      .xp-section { border-radius:20px; }
      .xp-bar { height:14px; border-radius:999px; overflow:hidden; background:#e7edf0; }
      .xp-fill { background:linear-gradient(90deg,var(--hp-green),#8ee000); border-radius:999px; transition:width .45s cubic-bezier(.2,.8,.2,1); }
      .habits-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
      .habit-card { position:relative; overflow:hidden; border:1px solid #e5e9ec; border-radius:24px; background:var(--hp-card); box-shadow:0 7px 20px rgba(31,42,52,.06); padding:18px; display:grid; grid-template-columns:112px 1fr; gap:16px; align-items:center; transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
      .habit-card:hover { transform:translateY(-3px); box-shadow:0 14px 30px rgba(31,42,52,.10); }
      .habit-card.is-complete { border-color:#b8e89a; background:linear-gradient(135deg,#fff,#f6fff0); }
      .habit-card--sad { opacity:.92; }
      .mascot-button { position:relative; border:0; background:none; padding:0; cursor:pointer; width:104px; height:104px; display:grid; place-items:center; border-radius:50%; }
      .mascot-orb { width:104px;height:104px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,#fff 0%,#f2f5f7 62%,#e6ecef 100%); box-shadow:inset 0 -7px 0 rgba(0,0,0,.06),0 6px 0 rgba(0,0,0,.07); transition:transform .15s ease; }
      .mascot-button:active .mascot-orb { transform:translateY(5px) scale(.97); box-shadow:inset 0 -2px 0 rgba(0,0,0,.05),0 2px 0 rgba(0,0,0,.06); }
      .mascot-svg { display:block; overflow:visible; }
      .mascot-svg .hp-face { transform-origin:center; }
      .mascot-button.is-bouncing .mascot-svg { animation:hp-bounce .55s cubic-bezier(.2,.8,.2,1); }
      .mascot-button.is-bouncing .mascot-orb { animation:hp-pop .55s ease; }
      .done-check { position:absolute; right:-2px; bottom:2px; width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--hp-green);color:#fff;font-weight:900;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.16); }
      .habit-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
      .habit-card-top h4 { margin:0; font-size:18px; line-height:1.2; }
      .habit-card-body p { margin:7px 0 12px; color:var(--hp-muted); line-height:1.4; }
      .xp-pill { flex:0 0 auto; background:#fff5cc; color:#8a6500; border-radius:999px; padding:5px 8px; font-size:12px; font-weight:800; }
      .habit-meta { display:flex; gap:12px; flex-wrap:wrap; font-size:13px; font-weight:700; color:#66757f; }
      .habit-card--excited .habit-meta span:last-child { color:#c27b00; }
      .habit-card--happy .habit-meta span:last-child { color:var(--hp-green-dark); }
      .habit-card--sad .habit-meta span:last-child { color:#d35b5b; }
      .hp-toast { position:fixed; z-index:100; left:50%; top:76px; transform:translate(-50%,-18px); opacity:0; pointer-events:none; background:#263238; color:#fff; border-radius:999px; padding:11px 16px; font-weight:800; box-shadow:0 10px 28px rgba(0,0,0,.2); transition:.25s ease; }
      .hp-toast.show { transform:translate(-50%,0); opacity:1; }
      .hp-toast.xp { background:var(--hp-green-dark); }
      .hp-confetti { position:fixed; inset:0; z-index:90; pointer-events:none; overflow:hidden; }
      .hp-confetti i { position:absolute; width:8px;height:14px; border-radius:2px; animation:hp-fall 900ms ease-out forwards; }
      .boss-card { border-radius:22px; }
      .boss-defeated { border:2px solid #b8e89a; box-shadow:0 12px 30px rgba(88,204,2,.12); }
      .achievement-card { border-radius:18px; transition:.2s ease; }
      .achievement-card.unlocked { border-color:#b8e89a; background:#f7fff2; }
      .management-mascot { flex:0 0 auto; }
      .habit-management-row,.mascot-setting-row { border-radius:16px; }
      .mobile-nav-spacer { display:none; }
      @keyframes hp-bounce { 0%,100%{transform:translateY(0) rotate(0)} 30%{transform:translateY(-13px) rotate(-4deg)} 60%{transform:translateY(2px) rotate(4deg)} }
      @keyframes hp-pop { 0%,100%{transform:scale(1)} 35%{transform:scale(1.08)} }
      @keyframes hp-fall { 0%{transform:translateY(-20px) rotate(0);opacity:1} 100%{transform:translateY(90vh) rotate(540deg);opacity:0} }
      @media (max-width: 800px) {
        body { padding-bottom:74px; }
        .main-nav { position:sticky; top:0; }
        .nav-container { padding:8px 12px; }
        .nav-brand .nav-tagline,.nav-user .user-details,.nav-user .btn { display:none !important; }
        .nav-brand h2 { font-size:19px; }
        .nav-menu { position:fixed; left:8px; right:8px; bottom:8px; z-index:80; display:grid; grid-template-columns:repeat(5,1fr); gap:4px; padding:7px; background:rgba(255,255,255,.94); border:1px solid #e1e7ea; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,.14); backdrop-filter:blur(14px); }
        .nav-btn { min-width:0; min-height:56px; padding:6px 3px; border-radius:14px; flex-direction:column; gap:2px; }
        .nav-icon { font-size:20px; line-height:20px; }
        .nav-label { font-size:10px; }
        .theme-toggle { font-size:18px; }
        .container { padding-left:12px; padding-right:12px; }
        .dashboard-welcome { padding:18px; border-radius:20px; }
        .stats-grid { grid-template-columns:repeat(2,1fr); }
        .habits-grid { grid-template-columns:1fr; gap:12px; }
        .habit-card { grid-template-columns:92px 1fr; padding:14px; border-radius:20px; gap:12px; }
        .mascot-button,.mascot-orb { width:88px;height:88px; }
        .mascot-svg { width:78px;height:78px; }
        .habit-card-top h4 { font-size:16px; }
        .habit-card-body p { font-size:13px; }
        .date-picker-container { flex-wrap:wrap; }
        .date-input { min-width:0; flex:1; }
        .section-header h3 { font-size:22px; }
        .chart-container { height:240px !important; }
        .stats-table { overflow-x:auto; }
        .settings-tabs { overflow-x:auto; justify-content:flex-start; padding-bottom:5px; }
        .settings-tab { white-space:nowrap; }
      }
      @media (max-width: 420px) {
        .stat-card { padding:12px !important; }
        .stat-icon { font-size:22px !important; }
        .stat-value { font-size:20px !important; }
        .habit-card { grid-template-columns:78px 1fr; }
        .mascot-button,.mascot-orb { width:76px;height:76px; }
        .mascot-svg { width:68px;height:68px; }
        .xp-pill { font-size:10px; }
      }
    `;
    document.head.appendChild(style);
  }

  function mascotSvg(animal, mood, size=94) {
    const palettes = {
      fox:['#F47B20','#FFF1E6'], owl:['#7757C7','#F2EDFF'], cat:['#718096','#F5F7FA'],
      panda:['#202124','#FFFFFF'], dog:['#B7791F','#FFF5D6'], capybara:['#A87850','#FFF0DD'],
      rabbit:['#E85AAD','#FFF0F8'], bear:['#8B5E3C','#FFF1E6']
    };
    const [main, light] = palettes[animal] || palettes.fox;
    const happy = mood==='happy', excited=mood==='excited', sad=mood==='sad';
    const eye = (x,y) => happy||excited
      ? `<path d="M${x-4} ${y} Q${x} ${y-7} ${x+4} ${y}" fill="none" stroke="#202124" stroke-width="3" stroke-linecap="round"/>`
      : `<circle cx="${x}" cy="${y}" r="3.2" fill="#202124"/>`;
    const mouth = excited
      ? '<path d="M34 52 Q44 68 54 52 Q44 58 34 52" fill="#202124"/>'
      : happy
        ? '<path d="M34 51 Q44 62 54 51" fill="none" stroke="#202124" stroke-width="3.2" stroke-linecap="round"/>'
        : sad
          ? '<path d="M34 58 Q44 48 54 58" fill="none" stroke="#202124" stroke-width="3.2" stroke-linecap="round"/>'
          : '<path d="M37 54 Q44 57 51 54" fill="none" stroke="#202124" stroke-width="3" stroke-linecap="round"/>';
    let ears = `<path d="M21 29 L25 8 L39 24 Z M49 24 L63 8 L67 29 Z" fill="${main}"/>`;
    if(animal==='owl') ears=`<path d="M19 29 Q22 9 37 20 Q44 15 51 20 Q66 9 69 29Z" fill="${main}"/>`;
    if(animal==='rabbit') ears=`<ellipse cx="31" cy="14" rx="7" ry="18" fill="${main}"/><ellipse cx="57" cy="14" rx="7" ry="18" fill="${main}"/><ellipse cx="31" cy="14" rx="3" ry="12" fill="#FFD1E7"/><ellipse cx="57" cy="14" rx="3" ry="12" fill="#FFD1E7"/>`;
    let faceExtra='';
    if(animal==='owl') faceExtra='<circle cx="34" cy="40" r="14" fill="#fff"/><circle cx="54" cy="40" r="14" fill="#fff"/><circle cx="44" cy="48" r="4" fill="#F5B700"/>';
    if(animal==='panda') faceExtra='<ellipse cx="34" cy="38" rx="8" ry="11" fill="#202124" transform="rotate(25 34 38)"/><ellipse cx="54" cy="38" rx="8" ry="11" fill="#202124" transform="rotate(-25 54 38)"/>';
    if(animal==='cat') faceExtra='<path d="M37 48 L44 53 L51 48 L44 57Z" fill="#E8A0B8"/>';
    if(animal==='dog') faceExtra='<ellipse cx="44" cy="49" rx="15" ry="12" fill="+light+"/><ellipse cx="44" cy="47" rx="4" ry="3" fill="#202124"/>';
    if(animal==='capybara') faceExtra='<ellipse cx="44" cy="48" rx="19" ry="15" fill="+light+"/><circle cx="38" cy="48" r="2.4" fill="#202124"/><circle cx="50" cy="48" r="2.4" fill="#202124"/>';
    if(animal==='bear') faceExtra='<ellipse cx="44" cy="50" rx="18" ry="14" fill="+light+"/>';
    const blush=(happy||excited)?'<circle cx="27" cy="50" r="4" fill="#FB7185" opacity=".35"/><circle cx="61" cy="50" r="4" fill="#FB7185" opacity=".35"/>':'';
    const sparkle=excited?'<path d="M70 13l4 8 8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1z" fill="#FFC800"/><path d="M15 24l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#58CC02"/>':'';
    const sadTear=sad?'<circle cx="55" cy="43" r="2.5" fill="#1CB0F6"/><path d="M55 45q-2 6 0 8" fill="none" stroke="#1CB0F6" stroke-width="2"/>':'';
    return `<svg class="mascot-svg" width="${size}" height="${size}" viewBox="0 0 88 88" role="img" aria-label="${animalNames[animal]||'Mascot'} ${mood}">
      <g class="hp-face">${ears}<circle cx="44" cy="43" r="29" fill="${main}"/><ellipse cx="44" cy="53" rx="25" ry="20" fill="+light+" opacity=".3"/>${faceExtra}${eye(35,40)}${eye(53,40)}${mouth}${blush}${sadTear}${sparkle}</g>
    </svg>`;
  }

  function loadEngine() {
    let raw=null;
    try { raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); } catch(_){}
    engine=Core.HabitEngine.fromLegacy(raw,seedHabits);
    if(!engine.getAllHabits().length) seedHabits.forEach(h=>engine.createHabit(h));
    engine.recalculateXP(); persist();
  }
  function persist(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(engine.serialize()));}catch(_){} }

  function moodFor(h) {
    if(engine.isComplete(h.id,selectedDate)) return engine.currentStreak(h.id,selectedDate)>=3?'excited':'happy';
    if(selectedDate<DATE() && engine.currentStreak(h.id,selectedDate)===0) return 'sad';
    return 'neutral';
  }
  function moodLabel(m) { return ({excited:'On fire!',happy:'Proud of you!',neutral:'Ready when you are',sad:'Misses you'})[m]; }

  function renderHabits() {
    const grid=$('habits-grid'); if(!grid)return;
    const habits=engine.getAllHabits();
    grid.innerHTML=habits.map(h=>{
      const mood=moodFor(h),done=engine.isComplete(h.id,selectedDate),streak=engine.currentStreak(h.id,selectedDate);
      return `<article class="habit-card habit-card--${mood} ${done?'is-complete':''}" data-habit-id="${esc(h.id)}">
        <button class="mascot-button" data-toggle-habit="${esc(h.id)}" aria-label="${done?'Undo':'Complete'} ${esc(h.name)}">
          <span class="mascot-orb">${mascotSvg(h.mascotId,mood,88)}</span>${done?'<span class="done-check" aria-hidden="true">✓</span>':''}
        </button>
        <div class="habit-card-body"><div class="habit-card-top"><h4>${esc(h.name)}</h4><span class="xp-pill">+${h.xp} XP</span></div>
          <p>${esc(h.description)}</p><div class="habit-meta"><span>🔥 ${streak} day${streak===1?'':'s'}</span><span>${moodLabel(mood)}</span></div>
        </div>
      </article>`;
    }).join('');
    grid.querySelectorAll('[data-toggle-habit]').forEach(btn=>btn.addEventListener('click',()=>toggleHabit(btn.dataset.toggleHabit,btn)));
  }

  function toggleHabit(id,button) {
    const wasDone=engine.isComplete(id,selectedDate);
    engine.toggleCompletion(id,selectedDate); persist();
    if(!wasDone) celebrate(id);
    renderAll();
    if(button){button.classList.add('is-bouncing');setTimeout(()=>button.classList.remove('is-bouncing'),600);}
  }

  function celebrate(id) {
    const h=engine.state.habits[id], streak=engine.currentStreak(id,selectedDate);
    toast(`+${h.xp} XP · ${streak} day streak`,'xp');
    confetti(streak>=3);
    if(engine.level()>Math.floor(previousXP/100)+1) toast(`🎉 Level ${engine.level()} unlocked!`,'xp');
    previousXP=engine.state.xp;
  }

  function toast(message,type='') {
    let t=$('hp-toast'); if(!t){t=document.createElement('div');t.id='hp-toast';t.className='hp-toast';document.body.appendChild(t);}
    t.textContent=message;t.className='hp-toast show '+type;clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),1900);
  }
  function confetti(big) {
    const wrap=document.createElement('div');wrap.className='hp-confetti';
    const n=big?30:14;
    for(let i=0;i<n;i++){const el=document.createElement('i');el.style.left=(Math.random()*100)+'%';el.style.top=(-10-Math.random()*15)+'%';el.style.background=['#58CC02','#FFC800','#1CB0F6','#FF4B4B','#CE82FF'][i%5];el.style.transform=`rotate(${Math.random()*180}deg)`;el.style.animationDelay=(Math.random()*120)+'ms';wrap.appendChild(el);}
    document.body.appendChild(wrap);setTimeout(()=>wrap.remove(),1200);
  }

  function renderStats() {
    const habits=engine.getAllHabits(),xp=engine.state.xp,level=engine.level(),daily=engine.dailyProgress(selectedDate);
    const best=habits.reduce((m,h)=>Math.max(m,engine.bestStreak(h.id)),0);
    if($('current-level'))$('current-level').textContent=level;if($('total-xp'))$('total-xp').textContent=xp;if($('best-streak'))$('best-streak').textContent=best;if($('daily-progress'))$('daily-progress').textContent=Math.round(daily*100)+'%';
    if($('demo-user-level'))$('demo-user-level').textContent=level;if($('user-level'))$('user-level').textContent=level;
    if($('xp-progress-text'))$('xp-progress-text').textContent=`${engine.xpIntoLevel()} / ${Core.XP_PER_LEVEL}`;
    if($('xp-fill'))$('xp-fill').style.width=`${engine.xpIntoLevel()}%`;
    if($('habit-date'))$('habit-date').value=selectedDate;
    if($('date-status'))$('date-status').textContent=selectedDate===DATE()?"Viewing today's habits":`Viewing ${selectedDate}`;
  }

  function renderBoss() {
    const days=new Set();engine.weeklySummary().forEach(d=>{if(d.completed>0)days.add(d.date);});
    const count=Math.min(7,days.size);if($('boss-fill'))$('boss-fill').style.width=Math.min(100,count/5*100)+'%';if($('boss-text'))$('boss-text').textContent=`${count}/5 days completed`;
    $('boss-card')?.classList.toggle('boss-defeated',count>=5);
  }

  function renderProgress() {
    const body=$('habit-stats-body');if(body)body.innerHTML=engine.getAllHabits().map(h=>`<div class="stats-row"><div>${mascotSvg(h.mascotId,moodFor(h),40)}<span>${esc(h.name)}</span></div><div>${engine.currentStreak(h.id)}d</div><div>${engine.bestStreak(h.id)}d</div><div>${Math.round(engine.completionRate(h.id)*100)}%</div></div>`).join('');
    const a=$('achievements-grid');if(a){const xp=engine.state.xp,best=engine.getAllHabits().reduce((m,h)=>Math.max(m,engine.bestStreak(h.id)),0);const badges=[['🌱','First Step','Complete your first habit',xp>0],['🔥','On a Roll','Reach a 3-day streak',best>=3],['⚡','Power Week','Earn 500 XP',xp>=500],['🏆','Consistency','Reach a 7-day streak',best>=7]];a.innerHTML=badges.map(b=>`<div class="achievement-card ${b[3]?'unlocked':''}"><div class="achievement-icon">${b[0]}</div><div><strong>${b[1]}</strong><p>${b[2]}</p></div></div>`).join('');}
    renderChart();
  }
  function renderChart(){const c=$('progress-chart');if(!c||!window.Chart)return;if(window.habitPalsChart)window.habitPalsChart.destroy();const w=engine.weeklySummary();window.habitPalsChart=new Chart(c,{type:'bar',data:{labels:w.map(x=>x.date.slice(5)),datasets:[{label:'Completed',data:w.map(x=>x.completed),borderRadius:9}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}}});}

  function renderManagement(){
    const box=$('habits-management');if(!box)return;
    box.innerHTML=engine.getAllHabits().map(h=>`<div class="habit-management-row"><div class="management-mascot">${mascotSvg(h.mascotId,'neutral',48)}</div><div class="management-copy"><strong>${esc(h.name)}</strong><span>${esc(h.category)} · ${h.xp} XP</span></div><button class="btn btn--outline btn--sm" data-archive="${esc(h.id)}">Remove</button></div>`).join('');
    box.querySelectorAll('[data-archive]').forEach(b=>b.addEventListener('click',()=>{if(engine.getAllHabits().length<=1)return toast('Keep at least one habit.');engine.archiveHabit(b.dataset.archive);persist();renderAll();}));
  }
  function addHabit(){
    const name=$('new-habit-name')?.value.trim();if(!name)return toast('Give your habit a name first.');
    engine.createHabit({name,description:$('new-habit-desc')?.value||'',xp:$('new-habit-xp')?.value||20,category:$('new-habit-category')?.value||'general',mascotId:animals[engine.getAllHabits().length%animals.length]});
    ['new-habit-name','new-habit-desc'].forEach(id=>{if($(id))$(id).value='';});persist();renderAll();toast('New HabitPal joined!');showView('dashboard');
  }
  function renderMascotSettings(){
    const box=$('mascot-settings');if(!box)return;
    box.innerHTML=engine.getAllHabits().map(h=>`<div class="mascot-setting-row"><div>${mascotSvg(h.mascotId,'happy',56)}</div><div><strong>${esc(h.name)}</strong><select data-mascot-for="${esc(h.id)}">${animals.map(a=>`<option value="${a}" ${a===h.mascotId?'selected':''}>${animalNames[a]}</option>`).join('')}</select></div></div>`).join('');
    box.querySelectorAll('[data-mascot-for]').forEach(s=>s.addEventListener('change',()=>{engine.updateHabit(s.dataset.mascotFor,{mascotId:s.value});persist();renderAll();toast(`${animalNames[s.value]} is now your Pal!`);}));
  }
  function weekKey(dateKey=DATE()){ const d=Core.parseDateKey(dateKey); const day=d.getDay(); d.setDate(d.getDate()-day); return Core.localDateKey(d); }
  function renderReflection(){
    const week=engine.weeklySummary(),rates=engine.getAllHabits().map(h=>({h,r:engine.completionRate(h.id,7)})).sort((a,b)=>b.r-a.r);
    if($('most-consistent'))$('most-consistent').textContent=rates[0]?.h.name||'—';if($('needs-attention'))$('needs-attention').textContent=rates.at(-1)?.h.name||'—';
    const best=[...week].sort((a,b)=>b.completed-a.completed)[0];if($('best-day'))$('best-day').textContent=best?.date||'—';
    if($('mascot-mood'))$('mascot-mood').textContent=`${Math.round(engine.dailyProgress()*100)}% of today's Pals are smiling.`;if($('reflection-date'))$('reflection-date').textContent=`Week ending ${DATE()}`;
    const saved=engine.state.reflections?.[weekKey()];
    if($('reflection-note'))$('reflection-note').value=saved?.note||'';
  }
  function saveReflection(){
    const note=$('reflection-note')?.value.trim()||'';
    if(!engine.state.reflections) engine.state.reflections={};
    engine.state.reflections[weekKey()]={note,updatedAt:new Date().toISOString()};
    persist(); toast('Reflection saved 💭');
  }
  function sendFeedback(){
    const message=$('feedback-message')?.value.trim()||'';
    if(!message){toast('Write a little feedback first.');return;}
    const feedback=JSON.parse(localStorage.getItem('habitPalsFeedback')||'[]');
    feedback.push({message,createdAt:new Date().toISOString()});
    localStorage.setItem('habitPalsFeedback',JSON.stringify(feedback));
    $('feedback-message').value=''; toast('Thanks — feedback saved locally.');
  }
  function renderAll(){renderStats();renderHabits();renderBoss();renderProgress();renderManagement();renderMascotSettings();renderReflection();}

  function showView(view){activeView=view;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===view+'-view'));document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));window.scrollTo({top:0,behavior:'smooth'});}

  function enterApp(){ $('welcome-screen')?.classList.add('hidden');$('main-app')?.classList.remove('hidden');renderAll(); }

  function setup(){
    injectV12Styles();loadEngine();previousXP=engine.state.xp;
    $('demo-mode')?.addEventListener('click',enterApp);
    document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
    $('today-btn')?.addEventListener('click',()=>{selectedDate=DATE();renderAll();});
    $('habit-date')?.addEventListener('change',e=>{selectedDate=e.target.value||DATE();renderAll();});
    $('add-habit-btn')?.addEventListener('click',addHabit);
    $('save-reflection')?.addEventListener('click',saveReflection);
    $('send-feedback')?.addEventListener('click',sendFeedback);
    $('theme-toggle')?.addEventListener('click',()=>document.body.classList.toggle('dark-mode'));
    $('sign-out-btn')?.addEventListener('click',()=>{localStorage.removeItem('habitPalsUser');location.reload();});
    window.handleCredentialResponse=response=>{
      try{const payload=JSON.parse(atob(response.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));localStorage.setItem('habitPalsUser',JSON.stringify({name:payload.name,email:payload.email,picture:payload.picture}));enterApp();}catch(_){enterApp();}
    };
    const user=JSON.parse(localStorage.getItem('habitPalsUser')||'null');
    if(user){$('google-user-profile')?.classList.remove('hidden');$('demo-user-info')?.classList.add('hidden');if($('user-name'))$('user-name').textContent=user.name||'HabitPal';if($('user-avatar'))$('user-avatar').src=user.picture||'';}
    document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.mascot-button')){e.preventDefault();e.target.click();}});
  }

  loadCore(()=>document.addEventListener('DOMContentLoaded',setup));
})();