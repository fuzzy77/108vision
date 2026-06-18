const state = { tab: 'commands', query: '', data: null };

document.getElementById('api-base').textContent = location.origin;

async function fetchSnapshot() {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.tab === 'store') params.set('type', 'all');
  const res = await fetch(`/api/snapshot?${params}`);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

function renderCommands(items) {
  const root = document.getElementById('content');
  root.innerHTML = '';
  if (!items.length) {
    root.appendChild(el('p', 'muted', 'Nessun command.'));
    return;
  }
  for (const c of items) {
    const card = el('div', 'card');
    card.innerHTML = `
      <div class="row">
        <h3>/${c.name}</h3>
        <span class="chip">command</span>
      </div>
      <p>${escapeHtml(c.description)}</p>
      ${c.aliases?.length ? `<p class="muted">Alias: ${c.aliases.map((a) => '/' + a).join(', ')}</p>` : ''}
    `;
    root.appendChild(card);
  }
}

function renderSkills(items) {
  const root = document.getElementById('content');
  root.innerHTML = '';
  for (const s of items) {
    const card = el('div', 'card');
    const triggers = (s.triggers || []).join(', ') || s.name;
    card.innerHTML = `
      <div class="row"><h3>${escapeHtml(s.name)}</h3><span class="chip">skill</span></div>
      <p>${escapeHtml(s.description)}</p>
      <p class="muted">Trigger: ${escapeHtml(triggers)}</p>
    `;
    root.appendChild(card);
  }
}

function renderAgents(items, active) {
  const root = document.getElementById('content');
  root.innerHTML = '';
  for (const a of items) {
    const card = el('div', 'card');
    const isActive = a.name === active;
    card.innerHTML = `
      <div class="row">
        <h3>${escapeHtml(a.avatar || '🤖')} ${escapeHtml(a.displayName)}</h3>
        <span class="chip ${isActive ? 'verified' : ''}">${isActive ? 'attivo' : '@' + a.name}</span>
      </div>
      <p>${escapeHtml(a.description)}</p>
    `;
    if (!isActive) {
      const btn = el('button', 'btn-sm', 'Usa');
      btn.onclick = async () => {
        await fetch('/api/agent/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: a.name }),
        });
        await refresh();
      };
      card.querySelector('.row').appendChild(btn);
    }
    root.appendChild(card);
  }
}

function renderMcp(items) {
  const root = document.getElementById('content');
  root.innerHTML = '';
  if (!items.length) {
    root.appendChild(el('p', 'muted', 'Nessun server MCP. Configura ~/.108ai/mcp.yml'));
    return;
  }
  for (const m of items) {
    const card = el('div', 'card');
    const st = m.status === 'running' ? 'running' : m.status === 'error' ? 'error' : '';
    card.innerHTML = `
      <div class="row">
        <h3>${escapeHtml(m.name)}</h3>
        <span class="chip ${st}">${m.status} · ${m.toolCount} tools</span>
      </div>
      <p>${escapeHtml(m.description || m.transport)}</p>
      ${m.lastError ? `<p class="muted" style="color:var(--danger)">${escapeHtml(m.lastError)}</p>` : ''}
    `;
    if (m.status !== 'running') {
      const btn = el('button', 'btn-sm', 'Avvia');
      btn.onclick = async () => {
        await fetch('/api/mcp/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: m.name }),
        });
        await refresh();
      };
      card.querySelector('.row').appendChild(btn);
    }
    root.appendChild(card);
  }
}

function renderStore(items) {
  const root = document.getElementById('content');
  root.innerHTML = '';
  for (const i of items) {
    const card = el('div', 'card');
    card.innerHTML = `
      <div class="row">
        <h3>${escapeHtml(i.displayName)}</h3>
        <span class="chip ${i.verified ? 'verified' : ''}">${i.type}${i.bundled ? ' · bundled' : ''}</span>
      </div>
      <p>${escapeHtml(i.description)}</p>
      <p class="muted">${i.category}${i.rating ? ' · ★ ' + i.rating : ''}${i.author ? ' · ' + escapeHtml(i.author) : ''}</p>
      <p class="muted">id: ${escapeHtml(i.id)}</p>
    `;
    const btn = el('button', 'btn-sm', i.bundled ? 'Verifica' : 'Installa');
    btn.onclick = async () => {
      const res = await fetch('/api/store/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: i.id }),
      });
      const data = await res.json();
      if (data.ok) {
        btn.textContent = 'OK';
        btn.disabled = true;
      } else {
        alert(data.message || data.error || 'Install fallita');
      }
    };
    card.querySelector('.row').appendChild(btn);
    root.appendChild(card);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function refresh() {
  try {
    const data = await fetchSnapshot();
    state.data = data;
    document.getElementById('active-agent').textContent = `agent: @${data.activeAgent}`;
    document.getElementById('updated-at').textContent = new Date(data.generatedAt).toLocaleString('it-IT');

    switch (state.tab) {
      case 'commands': renderCommands(data.commands); break;
      case 'skills': renderSkills(data.skills); break;
      case 'agents': renderAgents(data.agents, data.activeAgent); break;
      case 'mcp': renderMcp(data.mcp); break;
      case 'store': renderStore(data.store.items); break;
    }
  } catch (e) {
    document.getElementById('content').innerHTML = `<p class="muted">Errore caricamento: ${escapeHtml(e.message)}</p>`;
  }
}

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.tab = btn.dataset.tab;
    refresh();
  });
});

document.getElementById('search').addEventListener('input', (e) => {
  state.query = e.target.value;
  refresh();
});

document.getElementById('refresh').addEventListener('click', refresh);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    document.getElementById('search').focus();
  }
});

refresh();
setInterval(refresh, 15000);
