// script.js
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const [t,u,d]   = document.getElementById('password').value.trim().split(' ').map(Number);
  const timeMin   = t;
  const unsafe    = u;
  const distance  = d || 0;

  // clamp safety score
  const rawScore  = ((timeMin - unsafe) / timeMin) * 100;
  const safetyPct = Math.max(0, Math.min(100, rawScore));
  const avgSpeed  = distance / (timeMin / 60);

  // choose category & comment
  let category, comment;
  if (avgSpeed > 80) {
    category = 'red';
    const speedMsgs = [
      'Your average speed suggests you were likely speeding.',
      'Likely speeding detected from your average speed.',
      'The average speed implies you were probably over the limit.',
      'Be careful—your average speed indicates possible speeding.',
      'Your driving speed on average seems to have exceeded safe limits.'
    ];
    comment = speedMsgs[Math.floor(Math.random() * speedMsgs.length)];
  } else {
    if (safetyPct >= 90)      category = 'green';
    else if (safetyPct >= 75) category = 'yellow';
    else                      category = 'red';

    const safetyMsgs = {
      green: [
        'Excellent driving with minimal risky maneuvers!',
        'Very safe driving—keep up the good work!',
        'Smooth and cautious throughout the trip!',
        'Outstanding! Almost no unsafe movements detected.',
        'Flawless driving: you nailed it!'
      ],
      yellow: [
        `Overall safe driving, but ${unsafe} unsafe movement(s) detected.`,
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
    comment = safetyMsgs[category][Math.floor(Math.random() * safetyMsgs[category].length)];
  }

  // render combined card + other stats
  const statsEl = document.getElementById('stats');
  statsEl.innerHTML = `
    <div class="card score-comment ${category}">
      <div class="score-number">${safetyPct.toFixed(1)}%</div>
      <div class="score-text">${comment}</div>
    </div>
    <div class="card"><strong>Time Driving:</strong> ${timeMin.toFixed(1)} min</div>
    <div class="card"><strong>Unsafe Movements:</strong> ${unsafe}</div>
    <div class="card"><strong>Distance Travelled:</strong> ${distance.toFixed(1)} km</div>
    <div class="card"><strong>Avg Unsafe/min:</strong> ${(unsafe/timeMin).toFixed(2)}</div>
    <div class="card"><strong>Avg Speed:</strong> ${avgSpeed.toFixed(1)} km/h</div>
  `;

  document.getElementById('login').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');

  // update pie chart
  new Chart(
    document.getElementById('safetyChart').getContext('2d'),
    {
      type: 'pie',
      data: {
        labels: ['Safe %', 'Unsafe %'],
        datasets: [{
          data: [safetyPct.toFixed(1), (100 - safetyPct).toFixed(1)],
          backgroundColor: ['#4caf50', '#f44336']
        }]
      }
    }
  );
});
