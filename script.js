const loginForm = document.getElementById('loginForm');
const loginEl = document.getElementById('login');
const selectorEl = document.getElementById('sessionSelector');
const dashboardEl = document.getElementById('dashboard');
const statsEl = document.getElementById('stats');
const backBtn = document.getElementById('backBtn');
const timeInfo = document.getElementById('sessionTimeInfo');
const chartCtx = document.getElementById('safetyChart').getContext('2d');
const loadingEl = document.getElementById('loading');
const loadingMsgEl = document.getElementById('loadingMsg');
let pieChart;

// ---------- loader ----------
const LOAD_MIN = 1000, LOAD_MAX = 3000;
const messages = {
  toSessions: ['Connecting to cube…','Decrypting trip data…','Fetching sessions…'],
  toDashboard:['Analysing drive…','Warming up display…','Plotting safety pie…']
};
function showLoading(on){ loadingEl.classList.toggle('hidden', !on); }
function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function fakeWait(next, kind='toSessions'){
  loadingMsgEl.textContent = pick(messages[kind]);
  showLoading(true);
  const ms = rand(LOAD_MIN, LOAD_MAX);
  setTimeout(()=>{ showLoading(false); next(); }, ms);
}

// ---------- auth -> sessions ----------
loginForm.addEventListener('submit', e => {
  e.preventDefault();

  const raw   = document.getElementById('password').value.trim();
  const parts = raw.split(' ');
  const nums  = parts.map(Number);
  const valid = parts.length >= 2 && !nums.some(n => isNaN(n));

  if (valid) {
    const [timeMin, unsafe, distance = 0] = nums;
    const rawScore  = ((timeMin - unsafe) / timeMin) * 100;
    const safetyPct = Math.max(0, Math.min(100, rawScore));
    const avgSpeed  = distance / (timeMin / 60);

    // Demo-realistic end time: now minus 0–60 s; start based on duration
    const endMs   = Date.now() - Math.floor(Math.random()*60*1000);
    const startMs = endMs - timeMin*60*1000;

    const session = {
      timeMin, unsafe, distance, safetyPct, avgSpeed,
      startIso: new Date(startMs).toISOString(),
      endIso:   new Date(endMs).toISOString()
    };
    saveSession(session);
  }

  // Transition with loader
  loginEl.classList.add('hidden');
  dashboardEl.classList.add('hidden');
  fakeWait(showSessionSelector,'toSessions');
});

// ---------- storage ----------
function saveSession(sess){
  const sessions = JSON.parse(localStorage.getItem('drivingSessions')||'[]');
  sessions.unshift(sess);
  localStorage.setItem('drivingSessions', JSON.stringify(sessions));
}
function loadSessions(){
  return JSON.parse(localStorage.getItem('drivingSessions')||'[]');
}

// ---------- helpers ----------
function fmtRange(s){
  const st = s.startIso ? new Date(s.startIso)
           : s.timestamp ? new Date(s.timestamp)
           : new Date(Date.now() - s.timeMin*60*1000);
  const en = s.endIso ? new Date(s.endIso)
           : new Date(st.getTime() + s.timeMin*60*1000);
  return {
    date: st.toLocaleDateString(),
    times: `${st.toLocaleTimeString()} → ${en.toLocaleTimeString()}`,
    start: st, end: en
  };
}

function getMood(s){
  if (s.avgSpeed > 80) return 'angry';
  if (s.safetyPct >= 90) return 'happy';
  if (s.safetyPct >= 75) return 'neutral';
  return 'sad';
}
function moodLabel(m){
  return {happy:'Calm & confident', neutral:'Focused', sad:'Cautious', angry:'Agitated (likely speeding)'}[m];
}
function faceMarkup(m){
  return `
    <div class="fc face-cube mood--${m}" aria-label="${m} face">
      <div class="fc-screen">
        <span class="fc-eye left"></span>
        <span class="fc-eye right"></span>
        <span class="fc-brow left"></span>
        <span class="fc-brow right"></span>
        <span class="fc-mouth"></span>
      </div>
    </div>`;
}

// ---------- sessions page ----------
function showSessionSelector(){
  selectorEl.innerHTML = '<h2>Select Session</h2>';
  const sessions = loadSessions();

  if (!sessions.length) {
    selectorEl.innerHTML += '<p>No sessions available.</p>';
  } else {
    const recent = sessions[0];
    const r = fmtRange(recent);
    selectorEl.innerHTML += `
      <div class="card session-card large" data-index="0">
        <strong>Most Recent — ${r.date}</strong><br>
        ${r.times}<br>
        Score: ${recent.safetyPct.toFixed(1)}%
      </div>`;

    if (sessions.length > 1) {
      const listEl = document.createElement('div');
      listEl.className = 'session-list';
      sessions.slice(1).forEach((s,i) => {
        const idx = i+1;
        const f = fmtRange(s);
        const card = document.createElement('div');
        card.className = 'card session-card';
        card.dataset.index = idx;
        card.innerHTML = `
          <strong>${f.date}</strong><br>
          ${f.times}<br>
          Score: ${s.safetyPct.toFixed(1)}%`;
        listEl.appendChild(card);
      });
      selectorEl.appendChild(listEl);
    }

    selectorEl.querySelectorAll('.session-card').forEach(card => {
      card.addEventListener('click', () => {
        const s = loadSessions()[Number(card.dataset.index)];
        selectorEl.classList.add('hidden');
        fakeWait(()=>renderDashboard(s),'toDashboard');
      });
    });
  }
  selectorEl.classList.remove('hidden');
}

// ---------- dashboard ----------
function renderDashboard(s){
  const r = fmtRange(s);
  timeInfo.textContent = `Session: ${r.date} ${r.times}`;
  backBtn.classList.remove('hidden');

  const mood = getMood(s);
  statsEl.innerHTML = `
    <div class="card score-comment ${getCategory(s)}">
      <div class="score-wrap">
        <div class="score-face">${faceMarkup(mood)}</div>
        <div class="score-main">
          <div class="score-number">${s.safetyPct.toFixed(1)}%</div>
          <div class="score-text">${getComment(s)}</div>
        </div>
      </div>
    </div>
    <div class="card"><strong>Time Driving:</strong> ${s.timeMin.toFixed(1)} min</div>
    <div class="card"><strong>Unsafe Movements:</strong> ${s.unsafe}</div>
    <div class="card"><strong>Distance Travelled:</strong> ${s.distance.toFixed(1)} km</div>
    <div class="card"><strong>Avg Unsafe/min:</strong> ${(s.unsafe/s.timeMin).toFixed(2)}</div>
    <div class="card"><strong>Avg Speed:</strong> ${s.avgSpeed.toFixed(1)} km/h</div>`;

  dashboardEl.classList.remove('hidden');

  const data = [Number(s.safetyPct.toFixed(1)), Number((100 - s.safetyPct).toFixed(1))];
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(chartCtx, {
    type: 'pie',
    data: { labels: ['Safe %','Unsafe %'], datasets: [{ data }] }
  });

  backBtn.onclick = () => {
    dashboardEl.classList.add('hidden');
    backBtn.classList.add('hidden');
    fakeWait(showSessionSelector,'toSessions');
  };
}

// ---------- scoring helpers ----------
function getCategory(s){
  if (s.avgSpeed > 80) return 'red';
  if (s.safetyPct >= 90) return 'green';
  if (s.safetyPct >= 75) return 'yellow';
  return 'red';
}
function getComment(s){
  if (s.avgSpeed > 80) {
    const msgs = [
      'Your average speed suggests you were likely speeding.',
      'Likely speeding detected from your average speed.',
      'The average speed implies you were probably over the limit.',
      'Be careful—your average speed indicates possible speeding.',
      'Your driving speed on average seems to have exceeded safe limits.'
    ];
    return msgs[Math.floor(Math.random()*msgs.length)];
  } else {
    const safetyMsgs = {
      green: [
        'Excellent driving with minimal risky manoeuvres!',
        'Very safe driving—keep up the good work!',
        'Smooth and cautious throughout the trip!',
        'Outstanding! Almost no unsafe movements detected.',
        'Flawless driving: you nailed it!'
      ],
      yellow: [
        `Overall safe driving, but ${s.unsafe} unsafe movement(s) detected.`,
        'Good job—just a few spots to improve.',
        'Mostly safe, watch out for those quick turns.',
        'You did well, but trim down those abrupt stops.',
        'Solid drive, though a couple of risky moments.'
      ],
      red: [
        'Drive cautiously: too many unsafe movements.',
        'High-risk driving detected—belt up and focus!',
        'Warning: unsafe driving habits observed.',
        'Alert! Several dangerous manoeuvres were made.',
        'Please slow down and concentrate on the road.'
      ]
    };
    const cat = getCategory(s);
    const msgs = safetyMsgs[cat];
    return msgs[Math.floor(Math.random()*msgs.length)];
  }
}
