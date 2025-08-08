document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const pw = document.getElementById('password').value.trim().split(' ');
  const timeMin = parseFloat(pw[0]);
  const unsafe = parseInt(pw[1], 10);
  // compute
  const safetyPct = Math.max(0, ((timeMin - unsafe) / timeMin) * 100).toFixed(1);
  const avgUnsafePerMin = (unsafe / timeMin).toFixed(2);

  // render
  const statsEl = document.getElementById('stats');
  statsEl.innerHTML = `
    <div class="card"><strong>Time Driving</strong>: ${timeMin} min</div>
    <div class="card"><strong>Unsafe Movements</strong>: ${unsafe}</div>
    <div class="card"><strong>Safety</strong>: ${safetyPct}%</div>
    <div class="card"><strong>Avg Unsafe / min</strong>: ${avgUnsafePerMin}</div>
  `;

  // toggle views
  document.getElementById('login').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
});
