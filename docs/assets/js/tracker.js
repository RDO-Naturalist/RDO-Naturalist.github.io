// ===== Constants & helpers =====
const PREFIX = "TBVS_RDO_";
const KEYS = {
    theme: PREFIX + "theme",
    filtersOpen: PREFIX + "filters_open",
    sectionOpen: (cat) => PREFIX + "section_open_" + cat,
    action: (idx, key) => PREFIX + idx + ":" + key
};
const ACTIONS = [
    { key: "piste", icon: "🐾" },
    { key: "tue", icon: "🪦" },
    { key: "depece", icon: "🔪" },
    { key: "etudie", icon: "🔎" },
    { key: "anesthesie", icon: "💉" },
    { key: "echantillon", icon: "🧬" },
    { key: "photo", icon: "📸" }
];

const DATA = { base: null, names: null, cats: null, images: null };
let ANIMALS = [];
let baseById = {};

function isOn(key) { return localStorage.getItem(key) === "true"; }
function setOn(key, val) { localStorage.setItem(key, val ? "true" : "false"); }

function missionFlag(cond) { return /mission/i.test(cond) ? "mission" : "libre"; }
function tagSet(cond) {
    const s = (cond || "").toLowerCase();
    return {
        aube: /aube/.test(s),
        crepuscule: /crépuscule|crepuscule/.test(s),
        nuit: /nuit/.test(s),
        journee: /journée|journee/.test(s),
        pluie: /pluie/.test(s),
        brouillard: /brouillard/.test(s),
        orage: /orage/.test(s),
        clair: /clair/.test(s)
    };
}

async function loadJSON(path) { const r = await fetch(path, { cache: "no-store" }); return r.json(); }

// ===== Theme =====
function applyTheme(t) { document.documentElement.setAttribute("data-theme", t); localStorage.setItem(KEYS.theme, t); }
function initTheme() {
    const saved = localStorage.getItem(KEYS.theme);
    applyTheme(saved || "dark");
    document.getElementById("themeBtn")?.addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme");
        applyTheme(cur === "dark" ? "light" : "dark");
    });
}

// ===== Render =====
function rowCount(i) { return ACTIONS.reduce((n, a) => n + (isOn(KEYS.action(i, a.key)) ? 1 : 0), 0); }

function updateRow(i, cardEl) {
    const card = cardEl || document.querySelector(`.card[data-index="${i}"]`); if (!card) return;
    const done = rowCount(i);
    const pct = Math.round(done / ACTIONS.length * 100);
    const fill = card.querySelector('[data-fill]');
    fill.style.width = pct + "%";
    fill.classList.toggle('ok', pct >= 50);
    fill.classList.toggle('warn', pct < 50);
    card.querySelector('[data-pct]').textContent = pct + "%";
    card.querySelector('[data-count]').textContent = `${done}/${ACTIONS.length}`;
}

function updateGlobal() {
    const total = ANIMALS.length * ACTIONS.length;
    let checked = 0;
    ANIMALS.forEach((_, i) => checked += rowCount(i));
    const pct = total ? Math.round(checked / total * 100) : 0;
    const gFill = document.getElementById('gFill');
    const gPct = document.getElementById('gPct');
    const gCount = document.getElementById('gCount');
    gFill.style.width = pct + "%";
    gFill.classList.toggle('ok', pct >= 50);
    gFill.classList.toggle('warn', pct < 50);
    gPct.textContent = pct + "%";
    gCount.textContent = `${checked} / ${total} actions`;
}

function categoryIndices(catKey) {
    const cat = DATA.cats.find(c => c.key === catKey);
    if (!cat) return [];
    return cat.items.map(id => baseById[id]?.idx).filter(Number.isInteger);
}

function updateCategory(catKey) {
    const idxs = categoryIndices(catKey);
    const total = idxs.length * ACTIONS.length;
    let checked = 0;
    idxs.forEach(i => checked += rowCount(i));
    const pct = total ? Math.round(checked / total * 100) : 0;

    const pctEl = document.querySelector(`[data-cat-pct="${catKey}"]`);
    const fillEl = document.querySelector(`[data-cat-fill="${catKey}"]`);
    if (pctEl) { pctEl.textContent = pct + "%"; }
    if (fillEl) {
        fillEl.style.width = pct + "%";
        fillEl.classList.toggle('ok', pct >= 50);
        fillEl.classList.toggle('warn', pct < 50);
    }
}
function updateAllCategories() { DATA.cats.forEach(c => updateCategory(c.key)); }

function applyFilters() {
    const q = document.getElementById('q');
    const fMission = document.getElementById('fMission');
    const fTag = document.getElementById('fTag');
    const text = (q?.value || "").trim().toLowerCase();
    const missionVal = fMission?.value || "";
    const tagVal = fTag?.value || "";

    document.querySelectorAll('.card').forEach(card => {
        const i = +card.dataset.index;
        const a = ANIMALS[i];
        let visible = true;

        if (text) {
            const hay = `${a.displayName} ${a.location} ${a.condition}`.toLowerCase();
            visible = hay.includes(text);
        }
        if (visible && missionVal) visible = card.dataset.mission === missionVal;
        if (visible && tagVal) {
            const tags = JSON.parse(card.dataset.tags);
            visible = !!tags[tagVal];
        }
        card.style.display = visible ? "" : "none";
    });

    document.querySelectorAll('.section-card').forEach(sec => {
        const anyVisible = Array.from(sec.querySelectorAll('.card')).some(c => c.style.display !== 'none');
        sec.style.display = anyVisible ? "" : "none";
    });
}

function bindBulk() {
    document.getElementById('checkAll')?.addEventListener('click', () => {
        document.querySelectorAll('.card').forEach(card => {
            if (card.style.display === "none") return;
            const idx = card.dataset.index;
            ACTIONS.forEach(a => {
                const k = KEYS.action(idx, a.key);
                if (!isOn(k)) setOn(k, true);
                const b = card.querySelector(`.tick[data-key="${k}"]`);
                if (b) b.setAttribute('data-on', 'true');
            });
            updateRow(idx, card);
        });
        updateGlobal(); updateAllCategories(); scheduleSave();
    });

    document.getElementById('uncheckAll')?.addEventListener('click', () => {
        document.querySelectorAll('.card').forEach(card => {
            if (card.style.display === "none") return;
            const idx = card.dataset.index;
            ACTIONS.forEach(a => {
                const k = KEYS.action(idx, a.key);
                if (isOn(k)) setOn(k, false);
                const b = card.querySelector(`.tick[data-key="${k}"]`);
                if (b) b.setAttribute('data-on', 'false');
            });
            updateRow(idx, card);
        });
        updateGlobal(); updateAllCategories(); scheduleSave();
    });

    document.getElementById('resetAll')?.addEventListener('click', () => {
        ANIMALS.forEach((_, i) => ACTIONS.forEach(a => localStorage.removeItem(KEYS.action(i, a.key))));
        renderAll(); scheduleSave();
    });
}

function bindChips() {
    const legend = document.getElementById('legendChips');
    legend.innerHTML = ACTIONS.map(a => `<button class="chip" data-action-chip="${a.key}">${a.icon} ${a.key}</button>`).join('');
    legend?.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-action-chip]'); if (!chip) return;
        const actionKey = chip.getAttribute('data-action-chip');
        const visibleCards = Array.from(document.querySelectorAll('.card')).filter(c => c.style.display !== "none");
        let onCount = 0;
        visibleCards.forEach(card => {
            const idx = card.dataset.index;
            if (localStorage.getItem(KEYS.action(idx, actionKey)) === "true") onCount++;
        });
        const turnOn = onCount / Math.max(visibleCards.length, 1) < 0.5;
        visibleCards.forEach(card => {
            const idx = card.dataset.index;
            const key = KEYS.action(idx, actionKey);
            localStorage.setItem(key, String(turnOn));
            const btn = card.querySelector(`.tick[data-key="${key}"]`);
            if (btn) btn.setAttribute('data-on', String(turnOn));
            updateRow(idx, card);
        });
        updateGlobal(); updateAllCategories(); scheduleSave();
    }, { passive: true });
}

function bindTopBar() {
    const fMission = document.getElementById('fMission');
    const fTag = document.getElementById('fTag');
    const filtersPanel = document.getElementById('filtersPanel');
    const filtersToggleBtn = document.getElementById('filtersToggle');

    if (fMission) {
        fMission.innerHTML = `
      <option value="">Mission — Tous</option>
      <option value="mission">Mission uniquement</option>
      <option value="libre">Hors mission</option>`;
    }
    if (fTag) {
        fTag.innerHTML = `
      <option value="">Condition — Toutes</option>
      <option value="aube">Aube</option>
      <option value="crepuscule">Crépuscule</option>
      <option value="nuit">Nuit</option>
      <option value="journee">Journée</option>
      <option value="pluie">Pluie</option>
      <option value="brouillard">Brouillard</option>
      <option value="orage">Orage</option>
      <option value="clair">Temps clair</option>`;
    }

    const isDesktop = () => matchMedia("(min-width: 780px)").matches;
    const savedOpen = localStorage.getItem(KEYS.filtersOpen);
    filtersPanel.open = savedOpen ? savedOpen === "true" : isDesktop();
    filtersPanel.addEventListener('toggle', () => localStorage.setItem(KEYS.filtersOpen, String(filtersPanel.open)));
    filtersToggleBtn?.addEventListener('click', () => {
        filtersPanel.open = !filtersPanel.open;
        localStorage.setItem(KEYS.filtersOpen, String(filtersPanel.open));
    });

    document.getElementById('q')?.addEventListener('input', applyFilters, { passive: true });
    fMission?.addEventListener('change', applyFilters);
    fTag?.addEventListener('change', applyFilters);
}

function renderAll() {
    const groupsEl = document.getElementById('groups');
    groupsEl.innerHTML = "";

    DATA.cats.forEach(cat => {
        const section = document.createElement('details');
        section.className = "section-card";
        section.dataset.cat = cat.key;

        const secOpenKey = KEYS.sectionOpen(cat.key);
        const secSaved = localStorage.getItem(secOpenKey);
        section.open = secSaved ? secSaved === "true" : true;

        const summary = document.createElement('summary');
        summary.innerHTML = `
      <span class="cat-dot"></span> ${cat.title}
      <div class="cat-meta">
        <span class="cat-pct" data-cat-pct="${cat.key}">0%</span>
        <div class="cat-bar"><div class="cat-fill warn" data-cat-fill="${cat.key}"></div></div>
      </div>`;
        section.appendChild(summary);

        const body = document.createElement('div');
        body.className = "section-body";
        const cardsGrid = document.createElement('div');
        cardsGrid.className = "cards-grid";
        body.appendChild(cardsGrid);
        section.appendChild(body);

        cat.items.forEach(id => {
            const b = baseById[id]; if (!b) return;
            const a = ANIMALS[b.idx];
            const imgFile = DATA.images[id];
            const imgSrc = imgFile ? `assets/legendary/${cat.key}/${imgFile}` : "";

            const card = document.createElement('article');
            card.className = "card";
            card.dataset.index = b.idx;
            card.dataset.mission = a.mission;
            card.dataset.tags = JSON.stringify(a.tags);
            card.innerHTML = `
        <div class="top">
          ${imgSrc ? `<div class="thumb"><img src="${imgSrc}" alt="${a.displayName}" loading="lazy" decoding="async"></div>` : `<div class="thumb"></div>`}
          <div class="info">
            <div class="name">${a.displayName}</div>
            <div class="loc">📍 ${a.location}</div>
            <div class="cond">🧭 ${a.condition}</div>
          </div>
        </div>

        <div class="rowbar">
          <div class="pct" data-pct>0%</div>
          <div class="bar" style="flex:1"><div class="fill warn" data-fill style="width:0%"></div></div>
          <div class="count" data-count>0/${ACTIONS.length}</div>
        </div>

        <div class="checklist" role="group" aria-label="Checklist ${a.displayName}">
          ${ACTIONS.map(ac => {
                const key = KEYS.action(b.idx, ac.key), on = isOn(key);
                return `<button class="tick" data-key="${key}" data-on="${on}" title="${ac.key}">${ac.icon}</button>`;
            }).join('')}
        </div>
      `;
            cardsGrid.appendChild(card);
            updateRow(b.idx, card);
        });

        section.addEventListener('toggle', () => localStorage.setItem(secOpenKey, String(section.open)));
        groupsEl.appendChild(section);
    });

    // bind ticks
    groupsEl.querySelectorAll('.tick').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            const now = btn.getAttribute('data-on') !== "true";
            btn.setAttribute('data-on', String(now));
            setOn(key, now);
            const idx = key.replace(PREFIX, "").split(':')[0];
            const card = groupsEl.querySelector(`.card[data-index="${idx}"]`);
            updateRow(idx, card);
            updateGlobal();
            updateAllCategories();
            scheduleSave();
        }, { passive: true });
    });

    bindChips();
    applyFilters();
    updateGlobal();
    updateAllCategories();
}

async function boot() {
    initTheme();

    const [base, names, cats, images] = await Promise.all([
        loadJSON("data/base.json"),
        loadJSON("data/name_override.json"),
        loadJSON("data/categories.json"),
        loadJSON("data/images.json")
    ]);
    DATA.base = base; DATA.names = names; DATA.cats = cats; DATA.images = images;

    baseById = Object.fromEntries(base.map((a, i) => [a.id, { ...a, idx: i }]));
    ANIMALS = base.map((b, i) => {
        const display = DATA.names[b.id] || (b.name + " légendaire");
        return { ...b, idx: i, displayName: display, mission: missionFlag(b.condition), tags: tagSet(b.condition) };
    });

    bindTopBar();
    bindBulk();
    renderAll();

    // === Supabase auth/sync (colle tes fonctions ici)
    initSupabaseAuth();
    await maybeShowResetModalFromURL();
}

// ===== Supabase (reprends ton code, colle ici, et adapte les sélecteurs si besoin) =====
const SUPABASE_URL = 'https://qexqtfsvfrjbfisvgfdf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...FVwQ'; // ta clé déjà utilisée
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// -- Serialisation / application de la progression (identique à ton code)
function serializeProgress() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k.startsWith(PREFIX)) continue;
        const m = k.match(/^TBVS_RDO_(\d+):(.*)$/);
        if (!m) continue;
        const idx = m[1], action = m[2];
        (out[idx] ||= {})[action] = localStorage.getItem(k) === "true";
    }
    return out;
}
function applyProgressObject(obj) {
    Object.keys(localStorage).forEach(k => {
        if (k.startsWith(PREFIX) && k.includes(':')) localStorage.removeItem(k);
    });
    for (const [idx, actions] of Object.entries(obj || {})) {
        for (const [action, val] of Object.entries(actions)) {
            localStorage.setItem(`TBVS_RDO_${idx}:${action}`, String(!!val));
        }
    }
    renderAll();
}
function countChecked(obj) {
    let n = 0;
    for (const actions of Object.values(obj || {})) {
        for (const v of Object.values(actions)) if (v) n++;
    }
    return n;
}
function showConflictPrompt(localObj, cloudObj) {
    return new Promise(resolve => {
        document.getElementById('localCount').textContent = `Local : ${countChecked(localObj)} actions cochées`;
        document.getElementById('cloudCount').textContent = `Cloud : ${countChecked(cloudObj)} actions cochées`;
        const overlay = document.getElementById('conflictOverlay');
        overlay.hidden = false;
        const onLocal = () => { cleanup(); resolve('local'); };
        const onCloud = () => { cleanup(); resolve('cloud'); };
        function cleanup() {
            document.getElementById('keepLocalBtn').removeEventListener('click', onLocal);
            document.getElementById('useCloudBtn').removeEventListener('click', onCloud);
            overlay.hidden = true;
        }
        document.getElementById('keepLocalBtn').addEventListener('click', onLocal);
        document.getElementById('useCloudBtn').addEventListener('click', onCloud);
    });
}

let saveTimer = null;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveCloudProgress, 600); }
async function saveCloudProgress() {
    const { data: { session } } = await supa.auth.getSession();
    if (!session?.user) return;
    const payload = serializeProgress();
    await supa.from('progress').upsert({ user_id: session.user.id, data: payload });
}

async function loadCloudProgressWithPrompt(userId) {
    const { data, error } = await supa.from('progress').select('data').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') { console.error(error); return; }
    const localObj = serializeProgress();
    const cloudObj = data?.data || null;
    if (!cloudObj) {
        applyProgressObject(localObj);
        await supa.from('progress').upsert({ user_id: userId, data: localObj });
        return;
    }
    if (JSON.stringify(localObj) === JSON.stringify(cloudObj)) {
        applyProgressObject(cloudObj);
        return;
    }
    const choice = await showConflictPrompt(localObj, cloudObj);
    if (choice === 'local') {
        applyProgressObject(localObj);
        await supa.from('progress').upsert({ user_id: userId, data: localObj });
    } else {
        applyProgressObject(cloudObj);
    }
}

// -- Auth UI (reprends ta logique : tabs, login/signup, forgot, reset)
function initSupabaseAuth() {
    const overlay = document.getElementById('authOverlay');
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    const submitBtn = document.getElementById('authSubmit');
    const authMsg = document.getElementById('authMsg');
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const forgotBtn = document.getElementById('forgotBtn');
    const signOutBtnEl = document.getElementById('signOutBtn');

    let mode = 'login';
    function setMode(m) {
        mode = m;
        tabLogin.setAttribute('aria-selected', m === 'login');
        tabSignup.setAttribute('aria-selected', m === 'signup');
        submitBtn.textContent = (m === 'login') ? 'Se connecter' : 'Créer un compte';
        passInput.placeholder = (m === 'login') ? 'Mot de passe' : 'Créer un mot de passe';
        authMsg.textContent = '';
    }
    tabLogin?.addEventListener('click', () => setMode('login'));
    tabSignup?.addEventListener('click', () => setMode('signup'));

    submitBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        authMsg.textContent = '';
        const email = (emailInput.value || '').trim();
        const password = passInput.value || '';
        if (!email || !password) { authMsg.textContent = "Renseigne l'email et le mot de passe."; return; }
        submitBtn.disabled = true;

        if (mode === 'login') {
            const { error } = await supa.auth.signInWithPassword({ email, password });
            if (error) { authMsg.textContent = error.message; submitBtn.disabled = false; return; }
        } else {
            const redirectTo = location.origin + location.pathname; // /tracker/
            const { error } = await supa.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
            if (error) { authMsg.textContent = error.message; submitBtn.disabled = false; return; }
            authMsg.textContent = "Compte créé. Vérifie ta boîte mail pour confirmer (si requis).";
        }
    });

    document.getElementById('resetSubmit')?.addEventListener('click', async () => {
        const p1 = document.getElementById('newPass').value || '';
        const p2 = document.getElementById('newPass2').value || '';
        const msg = document.getElementById('resetMsg');
        if (!p1 || p1.length < 6) { msg.textContent = "Min 6 caractères."; return; }
        if (p1 !== p2) { msg.textContent = "Les mots de passe ne correspondent pas."; return; }
        const { error } = await supa.auth.updateUser({ password: p1 });
        msg.textContent = error ? error.message : "Mot de passe mis à jour ✅";
        if (!error) { setTimeout(() => document.getElementById('resetOverlay').hidden = true, 800); }
    });

    document.getElementById('signOutBtn')?.addEventListener('click', async () => { await supa.auth.signOut(); });

    forgotBtn?.addEventListener('click', async () => {
        const email = (emailInput.value || '').trim();
        if (!email) { authMsg.textContent = "Entre d'abord ton email."; return; }
        authMsg.textContent = "Envoi du lien de réinitialisation…";
        const redirectTo = location.origin + location.pathname + "?type=recovery";
        const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo });
        authMsg.textContent = error ? ("Erreur : " + error.message) : "Lien envoyé. Vérifie ta boîte mail.";
    });

    supa.auth.onAuthStateChange(async (_evt, session) => {
        const user = session?.user || null;
        if (user) {
            overlay.hidden = true;
            document.getElementById('signOutBtn').style.display = "inline-block";
            await loadCloudProgressWithPrompt(user.id);
        } else {
            document.getElementById('signOutBtn').style.display = "none";
            overlay.hidden = false;
        }
    });
}

async function maybeShowResetModalFromURL() {
    const params = new URLSearchParams(location.search);
    const isRecovery = params.get('type') === 'recovery';
    const hasHash = location.hash.includes('access_token') || location.hash.includes('refresh_token');
    const hasCode = params.get('code');
    if (hasHash || hasCode) {
        try {
            await supa.auth.exchangeCodeForSession(window.location.href);
            history.replaceState({}, '', location.origin + location.pathname + (isRecovery ? '?type=recovery' : ''));
        } catch (e) { console.error('exchangeCodeForSession failed', e); }
    }
    if (isRecovery) {
        document.getElementById('resetOverlay').hidden = false;
    }
}

// ===== Boot =====
document.addEventListener('DOMContentLoaded', boot);
