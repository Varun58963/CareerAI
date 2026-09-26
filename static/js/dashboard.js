/* dashboard.js */

let allRecs = [];

const GROWTH_ORDER = { 'Very High': 4, 'High': 3, 'Moderate': 2, 'Low': 1 };

document.addEventListener('DOMContentLoaded', loadRecommendations);

async function loadRecommendations() {
  const btn     = document.getElementById('refreshBtn');
  const spinner = document.getElementById('refreshSpinner');
  const grid    = document.getElementById('cardsGrid');
  const skel    = document.getElementById('skeleton');
  const empty   = document.getElementById('emptyState');
  const alert   = document.getElementById('dashAlert');

  btn.disabled = true;
  spinner.classList.remove('d-none');
  grid.classList.add('d-none');
  empty.classList.add('d-none');
  skel.classList.remove('d-none');

  const { ok, data } = await apiFetch('/api/recommend');

  btn.disabled = false;
  spinner.classList.add('d-none');
  skel.classList.add('d-none');

  if (!ok) {
    showAlert(alert, 'danger', data.error || 'Could not load recommendations. Please update your profile first.');
    empty.classList.remove('d-none');
    return;
  }

  allRecs = data.recommendations || [];
  if (!allRecs.length) { empty.classList.remove('d-none'); return; }

  renderCards(allRecs);
  grid.classList.remove('d-none');
}

function renderCards(recs) {
  const grid = document.getElementById('cardsGrid');
  const domainColors = {
    'Information Technology': 'primary',
    'Healthcare': 'danger',
    'Engineering': 'warning',
    'Finance & Commerce': 'success',
    'Business': 'info',
    'Law': 'secondary',
    'Design': 'purple',
    'Media & Communication': 'pink',
    'Analytics': 'primary',
    'Research': 'indigo',
    'Education': 'teal',
  };

  grid.innerHTML = recs.map(r => {
    const color  = domainColors[r.domain] || 'primary';
    const score  = r.compatibility_score;
    const scoreColor = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

    return `
      <div class="col-md-6 col-lg-4"
           data-score="${score}"
           data-salary="${r.avg_salary_lpa || 0}"
           data-growth="${GROWTH_ORDER[r.growth_rate] || 0}">
        <div class="card career-card h-100 p-4 border-0 shadow-sm"
             onclick="openModal(${r.career_id}, '${escHtml(r.career_name)}', '${escHtml(r.domain)}', ${JSON.stringify(r).replace(/'/g,"&#39;")})">

          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="d-flex gap-3 align-items-center">
              <div class="rank-badge">#${r.rank}</div>
              <div>
                <h6 class="fw-bold mb-0">${escHtml(r.career_name)}</h6>
                <span class="badge bg-${color} bg-opacity-10 text-${color} small">${escHtml(r.domain)}</span>
              </div>
            </div>
            <div class="text-center flex-shrink-0">
              <div class="fw-bold" style="font-size:1.3rem;color:${scoreColor};">${score.toFixed(1)}%</div>
              <div class="text-muted" style="font-size:.7rem;">Match</div>
            </div>
          </div>

          <p class="text-muted small mb-3" style="line-clamp:2;-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;">
            ${escHtml(r.description || '')}
          </p>

          <div class="d-flex flex-wrap gap-2 mt-auto">
            <span class="badge bg-light text-dark border">
              <i class="bi bi-currency-rupee"></i>${r.avg_salary_lpa} LPA
            </span>
            <span class="badge bg-light text-dark border">
              <i class="bi bi-graph-up-arrow text-success me-1"></i>${r.growth_rate}
            </span>
            <span class="badge bg-light text-dark border">
              <i class="bi bi-building me-1 text-primary"></i>${r.work_environment}
            </span>
          </div>

          <!-- Mini score bars -->
          <div class="mt-3 pt-3 border-top">
            <div class="d-flex justify-content-between mb-1">
              <span style="font-size:.7rem;color:#6B7280;">Score Breakdown</span>
            </div>
            ${['content_based','collaborative','random_forest'].map(k => `
              <div class="d-flex align-items-center gap-2 mb-1">
                <span style="font-size:.65rem;width:90px;color:#9CA3AF;">${k.replace('_',' ')}</span>
                <div class="flex-fill bg-light rounded" style="height:5px;">
                  <div class="rounded" style="height:5px;width:${r.scores[k]}%;background:#2563EB;"></div>
                </div>
                <span style="font-size:.65rem;width:32px;text-align:right;color:#6B7280;">${r.scores[k].toFixed(0)}%</span>
              </div>
            `).join('')}
          </div>

          <a href="/career/${r.career_id}"
             class="btn btn-outline-primary btn-sm mt-3 w-100"
             onclick="event.stopPropagation()">
            <i class="bi bi-arrow-right-circle me-1"></i>View Details & Skill Gap
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// ── Sorting ────────────────────────────────────────────────────────────────────
function sortCards(by) {
  document.querySelectorAll('.sort-btn').forEach(b => {
    b.className = 'btn btn-sm btn-outline-secondary sort-btn';
  });
  event.target.className = 'btn btn-sm btn-primary sort-btn active';

  const sorted = [...allRecs].sort((a, b) => {
    if (by === 'score')  return b.compatibility_score - a.compatibility_score;
    if (by === 'salary') return (b.avg_salary_lpa || 0) - (a.avg_salary_lpa || 0);
    if (by === 'growth') return (GROWTH_ORDER[b.growth_rate]||0) - (GROWTH_ORDER[a.growth_rate]||0);
    return 0;
  });
  renderCards(sorted);
  document.getElementById('cardsGrid').classList.remove('d-none');
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function openModal(id, name, domain, rec) {
  document.getElementById('modalCareerName').textContent = name;
  document.getElementById('modalDomain').textContent     = domain;
  document.getElementById('modalCareerLink').href        = `/career/${id}`;

  document.getElementById('modalBody').innerHTML = `
    <p class="text-muted">${escHtml(rec.description || '')}</p>
    <div class="row g-3 text-center">
      ${[
        ['Compatibility', rec.compatibility_score.toFixed(1)+'%', 'primary'],
        ['Avg Salary',    '₹'+rec.avg_salary_lpa+' LPA', 'success'],
        ['Growth Rate',   rec.growth_rate, 'warning'],
        ['Work Env.',     rec.work_environment, 'info'],
      ].map(([label, val, c]) => `
        <div class="col-6 col-md-3">
          <div class="bg-${c} bg-opacity-10 rounded-3 p-3">
            <div class="fw-bold text-${c}">${val}</div>
            <div class="text-muted small">${label}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  new bootstrap.Modal(document.getElementById('careerModal')).show();
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
