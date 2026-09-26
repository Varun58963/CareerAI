/* main.js — shared utilities */

/**
 * Show a Bootstrap alert inside an element.
 * @param {HTMLElement} el
 * @param {'success'|'danger'|'warning'|'info'} type
 * @param {string} msg
 */
function showAlert(el, type, msg) {
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.innerHTML = `<i class="bi bi-exclamation-circle-fill me-2"></i>${msg}`;
  el.classList.remove('d-none');
  setTimeout(() => el.classList.add('d-none'), 5000);
}

/**
 * Safely fetch JSON; returns {ok, data} so callers can check status.
 */
async function apiFetch(url, options = {}) {
  try {
    const res  = await fetch(url, options);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error('apiFetch error', url, e);
    return { ok: false, status: 0, data: { error: 'Network error' } };
  }
}
