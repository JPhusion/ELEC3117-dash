const loginForm = document.getElementById('loginForm');
const loginEl = document.getElementById('login');
const selectorEl = document.getElementById('sessionSelector');
const dashboardEl = document.getElementById('dashboard');
const statsEl = document.getElementById('stats');
const chartCtx = document.getElementById('safetyChart').getContext('2d');
let pieChart;

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
    const session   = { timeMin, unsafe, distance, safetyPct, avgSpeed, timestamp: new Date().toISOString() };
    saveSession(session);
  }

  // always show existing sessions
  showSessionSelector();
});

function saveSession(sess) {
  const sessions = JSON.parse(localStorage.getItem('drivingSessions')||'[]');
  sessions.unshift(sess);
  localStorage.setItem('drivingSessions', JSON.stringify(sessions));
}

function loadSessions() {
  return JSON.parse(localStorage.getItem('drivingSessions')||'[]');
}

function showSessionSelector() {
  loginEl.classList.add('hidden');
  dashboardEl.classList.add('hidden');
  selectorEl.innerHTML = '<h2>Select Session</h2>';
  const sessions = loadSessions();

  if (!sessions.length) {
    selectorEl.innerHTML += '<p>No sessions available.</p>';
  } else {
    const recent = sessions[0];
    selectorEl.innerHTML += `
      <div class="card session-card large" data-index="0">
        <strong>Most Recent (${new Date(recent.timestamp).toLocaleString()}):</strong><br>
        Score: ${recent.safetyPct.toFixed(1)}%
      </div>`;
    if (sessions.length > 1) {
      const listEl = document.createElement('div');
      listEl.className = 'session-list';
      sessions.slice(1).forEach((s,i) => {
        const idx = i+1;
        const card = document.createElement('div');
        card.className = 'card session-card';
        card.dataset.index = idx;
        card.innerHTML = `
          <strong>${new Date(s.timestamp).toLocaleString()}</strong><br>
          Score: ${s.safetyPct.toFixed(1)}%`;
        listEl.appendChild(card);
      });
      selectorEl.appendChild(listEl);
    }
    document.querySelectorAll('.session-card').forEach(card => {
      card.addEventListener('click', () => {
        renderDashboard(loadSessions()[card.dataset.index]);
      });
    });
  }
  selectorEl.classList.remove('hidden');
}

function renderDashboard(s) {
  selectorEl.classList.add('hidden');
  statsEl.innerHTML = `
    <div class="card score-comment ${getCategory(s)}">
      <div class="score-number">${s.safetyPct.toFixed(1)}%</div>
      <div class="score-text">${getComment(s)}</div>
    </div>
    <div class="card"><strong>Time Driving:</strong> ${s.timeMin.toFixed(1)} min</div>
    <div class="card"><strong>Unsafe Movements:</strong> ${s.unsafe}</div>
    <div class="card"><strong>Distance Travelled:</strong> ${s.distance.toFixed(1)} km</div>
    <div class="card"><strong>Avg Unsafe/min:</strong> ${(s.unsafe/s.timeMin).toFixed(2)}</div>
    <div class="card"><strong>Avg Speed:</strong> ${s.avgSpeed.toFixed(1)} km/h</div>`;
  dashboardEl.classList.remove('hidden');

  const data = [s.safetyPct.toFixed(1), (100 - s.safetyPct).toFixed(1)];
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(chartCtx, {
    type: 'pie',
    data: { labels: ['Safe %','Unsafe %'], datasets: [{ data }] }
  });
}

function getCategory(s) {
  if (s.avgSpeed > 80) return 'red';
  if (s.safetyPct >= 90) return 'green';
  if (s.safetyPct >= 75) return 'yellow';
  return 'red';
}

function getComment(s) {
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
        'Excellent driving with minimal risky maneuvers!',
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
        'Alert! Several dangerous maneuvers were made.',
        'Please slow down and concentrate on the road.'
      ]
    };
    const cat = getCategory(s);
    const msgs = safetyMsgs[cat];
    return msgs[Math.floor(Math.random()*msgs.length)];
  }
}
