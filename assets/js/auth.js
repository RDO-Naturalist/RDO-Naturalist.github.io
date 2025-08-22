// Authentication logic for login page and shared Supabase client
const SUPABASE_URL = 'https://qexqtfsvfrjbfisvgfdf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...FVwQ';
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

function initAuthPage() {
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    const submitBtn = document.getElementById('authSubmit');
    const authMsg = document.getElementById('authMsg');
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const forgotBtn = document.getElementById('forgotBtn');

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
            const redirectTo = location.origin + '/tracker/';
            const { error } = await supa.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
            if (error) { authMsg.textContent = error.message; submitBtn.disabled = false; return; }
            authMsg.textContent = "Compte créé. Vérifie ta boîte mail pour confirmer (si requis).";
        }
    });

    document.getElementById('resetSubmit')?.addEventListener('click', async () => {
        const p1 = document.getElementById('newPass').value || '';
        const p2 = document.getElementById('newPass2').value || '';
        const msg = document.getElementById('resetMsg');
        if (!p1 || p1.length < 6) { msg.textContent = 'Min 6 caractères.'; return; }
        if (p1 !== p2) { msg.textContent = 'Les mots de passe ne correspondent pas.'; return; }
        const { error } = await supa.auth.updateUser({ password: p1 });
        msg.textContent = error ? error.message : 'Mot de passe mis à jour ✅';
        if (!error) { setTimeout(() => document.getElementById('resetOverlay').hidden = true, 800); }
    });

    forgotBtn?.addEventListener('click', async () => {
        const email = (emailInput.value || '').trim();
        if (!email) { authMsg.textContent = "Entre d'abord ton email."; return; }
        authMsg.textContent = 'Envoi du lien de réinitialisation…';
        const redirectTo = location.origin + '/?type=recovery';
        const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo });
        authMsg.textContent = error ? ('Erreur : ' + error.message) : 'Lien envoyé. Vérifie ta boîte mail.';
    });

    supa.auth.onAuthStateChange((_evt, session) => {
        if (session?.user) {
            window.location.href = 'tracker/';
        }
    });

    supa.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            window.location.href = 'tracker/';
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('authCard')) {
        initAuthPage();
        maybeShowResetModalFromURL();
    }
});

